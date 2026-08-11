import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function sanitizeText(input: unknown): string {
  return String(input ?? '').trim().replace(/<[^>]*>/g, '');
}

function analyzeQuality(input: string): { flags: string[]; priority: number } {
  const normalized = input
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  const flags = new Set<string>();

  if (normalized.length < 20) flags.add('thin_comment');
  if (/(.)\1{5,}/i.test(input)) flags.add('repeated_characters');
  if (input.length >= 20) {
    const letters = input.replace(/[^a-z]/gi, '');
    const uppercase = letters.replace(/[^A-Z]/g, '');
    if (letters.length >= 12 && uppercase.length / letters.length > 0.7) {
      flags.add('mostly_caps');
    }
  }
  if (['bekar', 'fazool', 'hate', 'idiot', 'stupid', 'useless', 'worst'].some((word) => normalized.includes(word))) {
    flags.add('possible_abuse');
  }

  let priority = 0;
  if (flags.has('possible_abuse')) priority += 60;
  if (flags.has('mostly_caps')) priority += 20;
  if (flags.has('repeated_characters')) priority += 20;
  if (flags.has('thin_comment')) priority += 10;

  return { flags: [...flags], priority };
}

interface VerifiedIdentity {
  uid: string;
  email: string;
}

const PAPERS_BUCKET = 'papers';
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_TOTAL_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_PAGES = 10;

interface UploadFileRequest {
  name: string;
  contentType?: string;
  size?: number;
}

type LostFoundKind = 'lost' | 'found';

function validateLostFoundKind(kind: unknown): LostFoundKind {
  if (kind !== 'lost' && kind !== 'found') throw new Error('Choose lost or found.');
  return kind;
}

function optionalUrl(input: unknown): string | null {
  const value = sanitizeText(input);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error('Photo link must be a valid URL.');
  }
}

async function getVerifiedIdentity(authHeader: string | null): Promise<VerifiedIdentity> {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Missing Firebase token.');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${requiredEnv('FIREBASE_API_KEY')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  );

  const data = await response.json();
  const uid = data?.users?.[0]?.localId;
  const email = data?.users?.[0]?.email;
  if (!response.ok || !uid || !email) throw new Error('Not authorized.');
  return { uid, email };
}

async function getOrCreateUserId(supabase: SupabaseClient, identity: VerifiedIdentity): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { firebase_uid: identity.uid, email: identity.email },
      { onConflict: 'firebase_uid', ignoreDuplicates: false },
    )
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function getOrCreateUserRow(supabase: SupabaseClient, identity: VerifiedIdentity) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { firebase_uid: identity.uid, email: identity.email },
      { onConflict: 'firebase_uid', ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateCount(
  supabase: SupabaseClient,
  table: 'questions' | 'answers',
  id: string,
  column: 'upvote_count' | 'reported_count' | 'answer_count',
  count: number,
  extra: Record<string, unknown> = {},
) {
  const { error } = await supabase.from(table).update({ [column]: count, ...extra }).eq('id', id);
  if (error) throw error;
}

function safeFileName(name: string): string {
  const safe = sanitizeText(name).replace(/[^\w.\-]+/g, '_');
  return safe || 'upload';
}

function contentTypeFor(fileName: string, contentType?: string): string {
  const normalized = String(contentType ?? '').toLowerCase();
  if (normalized === 'application/pdf' || normalized === 'image/jpeg' || normalized === 'image/png') {
    return normalized;
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return 'application/octet-stream';
}

function validateUploadFiles(files: UploadFileRequest[]): void {
  if (files.length === 0) throw new Error('Choose a PDF or at least one image.');
  if (files.length > MAX_IMAGE_PAGES) throw new Error(`Upload up to ${MAX_IMAGE_PAGES} image pages at once.`);

  const types = files.map((file) => contentTypeFor(file.name, file.contentType));
  const hasPdf = types.some((type) => type === 'application/pdf');
  const hasImage = types.some((type) => type === 'image/jpeg' || type === 'image/png');
  if (hasPdf && files.length > 1) throw new Error('Upload either one PDF or up to 10 image pages.');
  if (hasPdf && hasImage) throw new Error('Upload either one PDF or image pages, not both.');
  if (types.some((type) => type === 'application/octet-stream')) {
    throw new Error('Only PDF, JPG, and PNG files are allowed.');
  }

  const total = files.reduce((sum, file) => sum + Number(file.size ?? 0), 0);
  if (total > MAX_UPLOAD_TOTAL_BYTES) throw new Error('Selected files are too large.');

  for (const [index, file] of files.entries()) {
    const size = Number(file.size ?? 0);
    const limit = types[index] === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (size > limit) throw new Error(`"${file.name}" is too large.`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const identity = await getVerifiedIdentity(req.headers.get('Authorization'));
    const { action, payload = {} } = await req.json();
    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
    const userId = await getOrCreateUserId(supabase, identity);

    if (action === 'getOrCreateUser') {
      const user = await getOrCreateUserRow(supabase, identity);
      return Response.json({ data: user }, { headers: corsHeaders });
    }

    if (action === 'updateUserName') {
      const name = sanitizeText(payload.name);
      if (name.length < 1) throw new Error('Name is required.');

      const { data, error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;

      return Response.json({ data }, { headers: corsHeaders });
    }

    if (action === 'submitQuestion') {
      const title = sanitizeText(payload.title);
      const body = sanitizeText(payload.body);
      if (title.length < 12) throw new Error('Question title is too short.');
      const quality = analyzeQuality(`${title} ${body}`);

      const { error } = await supabase.from('questions').insert({
        user_id: userId,
        title,
        body: body || null,
        department_id: payload.departmentId ?? null,
        is_anonymous: Boolean(payload.isAnonymous),
        quality_flags: quality.flags,
        moderation_priority: quality.priority,
        teacher_id: payload.teacherId ?? null,
        paper_id: payload.paperId ?? null,
      });
      if (error) throw error;

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action === 'submitTeacherSuggestion') {
      const name = sanitizeText(payload.name);
      const departmentId = payload.departmentId;
      if (name.length < 2) throw new Error('Teacher name is too short.');
      if (!departmentId) throw new Error('Choose a department.');

      const { count, error: duplicateError } = await supabase
        .from('teacher_suggestions')
        .select('id', { count: 'exact', head: true })
        .ilike('name', name)
        .eq('department_id', departmentId)
        .eq('approved', false);
      if (duplicateError) throw duplicateError;
      if ((count ?? 0) > 0) {
        throw new Error('This teacher has already been suggested for that department.');
      }

      const { error } = await supabase.from('teacher_suggestions').insert({
        name,
        department_id: departmentId,
        suggested_by: userId,
        approved: false,
      });
      if (error) throw error;

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action === 'createPaperUploadUrls') {
      const files: UploadFileRequest[] = Array.isArray(payload.files)
        ? payload.files.map((file: Record<string, unknown>) => ({
            name: String(file.name ?? ''),
            contentType: file.contentType ? String(file.contentType) : undefined,
            size: file.size === null || file.size === undefined ? undefined : Number(file.size),
          }))
        : [];
      validateUploadFiles(files);

      const batchId = `${Date.now()}-${crypto.randomUUID()}`;
      const uploads = [];
      for (const [index, file] of files.entries()) {
        const safeName = safeFileName(file.name);
        const path = `${userId}/${batchId}-${index + 1}-${safeName}`;
        const { data, error } = await supabase.storage
          .from(PAPERS_BUCKET)
          .createSignedUploadUrl(path);
        if (error) throw error;
        uploads.push({
          path,
          token: data.token,
          publicUrl: `${requiredEnv('SUPABASE_URL')}/storage/v1/object/public/${PAPERS_BUCKET}/${path}`,
        });
      }

      return Response.json({ data: { uploads } }, { headers: corsHeaders });
    }

    if (action === 'deletePaperUploadFiles') {
      const paths: string[] = Array.isArray(payload.paths) ? payload.paths.map(String) : [];
      const scopedPaths = paths.filter((path) => path.startsWith(`${userId}/`));
      if (scopedPaths.length > 0) {
        const { error } = await supabase.storage.from(PAPERS_BUCKET).remove(scopedPaths);
        if (error) throw error;
      }

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action === 'submitPaperUpload') {
      const title = sanitizeText(payload.title);
      const subject = sanitizeText(payload.subject);
      const kind = payload.kind;
      const year = payload.year === null || payload.year === undefined ? null : Number(payload.year);
      const fileUrl = String(payload.fileUrl ?? '');
      const fileUrls: string[] = Array.isArray(payload.fileUrls) ? payload.fileUrls.map(String) : [];
      const publicBucketPrefix = `${requiredEnv('SUPABASE_URL')}/storage/v1/object/public/papers/`;

      if (!title) throw new Error('Title is required.');
      if (!subject) throw new Error('Subject is required.');
      if (kind !== 'past_paper' && kind !== 'notes') throw new Error('Choose a valid upload type.');
      if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
        throw new Error('Enter a valid year.');
      }
      if (!fileUrl.startsWith(publicBucketPrefix) || fileUrls.length === 0) {
        throw new Error('Invalid uploaded file URL.');
      }
      if (fileUrls.some((url) => !url.startsWith(publicBucketPrefix))) {
        throw new Error('Invalid uploaded file URL.');
      }
      if (fileUrls.some((url) => !url.startsWith(`${publicBucketPrefix}${userId}/`))) {
        throw new Error('Invalid uploaded file URL.');
      }

      const { error } = await supabase.from('uploads').insert({
        user_id: userId,
        title,
        subject,
        department_id: payload.departmentId ?? null,
        year,
        type: kind,
        file_url: fileUrl,
        file_urls: fileUrls,
        approved: false,
      });
      if (error) throw error;

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action === 'listLostFoundItems') {
      const { data, error } = await supabase
        .from('lost_found_items')
        .select(
          'id, kind, item_name, description, university, campus, location, contact_name, whatsapp, email, photo_url, created_at',
        )
        .eq('status', 'approved')
        .eq('approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return Response.json({ data: data ?? [] }, { headers: corsHeaders });
    }

    if (action === 'submitLostFoundItem') {
      const kind = validateLostFoundKind(payload.kind);
      const itemName = sanitizeText(payload.itemName);
      const description = sanitizeText(payload.description);
      const university = sanitizeText(payload.university) || 'NED University';
      const campus = sanitizeText(payload.campus) || null;
      const location = sanitizeText(payload.location);
      const contactName = sanitizeText(payload.contactName);
      const whatsapp = sanitizeText(payload.whatsapp) || null;
      const email = sanitizeText(payload.email || identity.email);
      const photoUrl = optionalUrl(payload.photoUrl);

      if (itemName.length < 2) throw new Error('Item name is too short.');
      if (description.length < 10) throw new Error('Description is too short.');
      if (location.length < 3) throw new Error('Location is required.');
      if (contactName.length < 2) throw new Error('Contact name is required.');
      if (!email.includes('@')) throw new Error('Enter a valid email address.');

      const { error } = await supabase.from('lost_found_items').insert({
        user_id: userId,
        kind,
        item_name: itemName,
        description,
        university,
        campus,
        location,
        contact_name: contactName,
        whatsapp,
        email,
        photo_url: photoUrl,
        approved: false,
        status: 'pending',
      });
      if (error) throw error;

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action === 'submitAnswer') {
      const questionId = payload.questionId;
      const body = sanitizeText(payload.body);
      if (!questionId) throw new Error('Missing question id.');
      if (body.length < 8) throw new Error('Answer is too short.');
      const quality = analyzeQuality(body);

      const { error: insertError } = await supabase.from('answers').insert({
        question_id: questionId,
        user_id: userId,
        body,
        is_anonymous: Boolean(payload.isAnonymous),
        quality_flags: quality.flags,
        moderation_priority: quality.priority,
      });
      if (insertError) throw insertError;

      const countResult = await supabase
        .from('answers')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', questionId)
        .eq('status', 'active');
      if (countResult.error) throw countResult.error;
      await updateCount(supabase, 'questions', questionId, 'answer_count', countResult.count ?? 0);

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action === 'toggleQuestionVote' || action === 'toggleAnswerVote') {
      const isQuestion = action === 'toggleQuestionVote';
      const targetId = isQuestion ? payload.questionId : payload.answerId;
      if (!targetId) throw new Error('Missing target id.');

      const voteTable = isQuestion ? 'question_votes' : 'answer_votes';
      const targetColumn = isQuestion ? 'question_id' : 'answer_id';
      const targetTable = isQuestion ? 'questions' : 'answers';

      const existing = await supabase
        .from(voteTable)
        .select('id')
        .eq(targetColumn, targetId)
        .eq('user_id', userId)
        .maybeSingle();
      if (existing.error) throw existing.error;

      let voted = false;
      if (existing.data) {
        const { error } = await supabase.from(voteTable).delete().eq('id', existing.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(voteTable).insert({
          [targetColumn]: targetId,
          user_id: userId,
        });
        if (error) throw error;
        voted = true;
      }

      const countResult = await supabase
        .from(voteTable)
        .select('id', { count: 'exact', head: true })
        .eq(targetColumn, targetId);
      if (countResult.error) throw countResult.error;
      const count = countResult.count ?? 0;
      await updateCount(supabase, targetTable, targetId, 'upvote_count', count);

      return Response.json({ data: { voted, count } }, { headers: corsHeaders });
    }

    if (action === 'reportQuestion' || action === 'reportAnswer') {
      const isQuestion = action === 'reportQuestion';
      const targetId = isQuestion ? payload.questionId : payload.answerId;
      if (!targetId) throw new Error('Missing target id.');

      const reportTable = isQuestion ? 'question_reports' : 'answer_reports';
      const targetColumn = isQuestion ? 'question_id' : 'answer_id';
      const targetTable = isQuestion ? 'questions' : 'answers';

      const { error: insertError } = await supabase.from(reportTable).upsert(
        {
          [targetColumn]: targetId,
          user_id: userId,
        },
        { onConflict: `${targetColumn},user_id`, ignoreDuplicates: true },
      );
      if (insertError) throw insertError;

      const countResult = await supabase
        .from(reportTable)
        .select('id', { count: 'exact', head: true })
        .eq(targetColumn, targetId);
      if (countResult.error) throw countResult.error;
      const count = countResult.count ?? 0;
      await updateCount(supabase, targetTable, targetId, 'reported_count', count, {
        reported: true,
        moderation_priority: Math.min(100, 60 + count * 10),
      });

      return Response.json({ data: { reported: true, count } }, { headers: corsHeaders });
    }

    throw new Error(`Unknown community action: ${action}`);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Community action failed.' },
      { status: 401, headers: corsHeaders },
    );
  }
});
