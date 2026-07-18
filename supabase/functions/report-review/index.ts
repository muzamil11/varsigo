import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_REVIEWS_PER_DAY = 3;

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function sanitizeText(input: unknown): string {
  return String(input ?? '').trim().replace(/<[^>]*>/g, '');
}

function normalizeComment(comment: string): string {
  return comment
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function analyzeReviewQuality(comment: string): { flags: string[]; priority: number; fingerprint: string } {
  const normalized = normalizeComment(comment);
  const flags = new Set<string>();

  if (normalized.length < 20) flags.add('thin_comment');
  if (/(.)\1{5,}/i.test(comment)) flags.add('repeated_characters');
  if (comment.length >= 20) {
    const letters = comment.replace(/[^a-z]/gi, '');
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

  return { flags: [...flags], priority, fingerprint: normalized.slice(0, 240) };
}

function assertScore(value: unknown, name: string): number {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error(`${name} must be between 1 and 5.`);
  }
  return score;
}

async function getVerifiedPhone(authHeader: string | null): Promise<string> {
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
  const phone = data?.users?.[0]?.phoneNumber;
  if (!response.ok || !phone) throw new Error('Not authorized.');
  return phone;
}

async function getOrCreateUserId(supabase: SupabaseClient, phone: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .upsert({ phone }, { onConflict: 'phone', ignoreDuplicates: false })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const phone = await getVerifiedPhone(req.headers.get('Authorization'));
    const body = await req.json();
    const action = body.action ?? 'reportReview';
    const payload = body.payload ?? body;

    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );

    if (action === 'submitReview') {
      const userId = await getOrCreateUserId(supabase, phone);
      const teacherId = payload.teacherId;
      const comment = sanitizeText(payload.comment);
      if (!teacherId) throw new Error('Missing teacher id.');
      if (comment.length < 10) throw new Error('Review comment is too short.');

      const teachingScore = assertScore(payload.teachingScore, 'Teaching score');
      const gradingScore = assertScore(payload.gradingScore, 'Grading score');
      const attendanceScore = assertScore(payload.attendanceScore, 'Attendance score');

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfToday.toISOString());
      if (countError) throw countError;
      if ((count ?? 0) >= MAX_REVIEWS_PER_DAY) {
        throw new Error(`You've reached the daily limit of ${MAX_REVIEWS_PER_DAY} reviews. Please try again tomorrow.`);
      }

      const quality = analyzeReviewQuality(comment);
      const duplicateSince = new Date();
      duplicateSince.setDate(duplicateSince.getDate() - 90);

      const { count: duplicateCount, error: duplicateError } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('teacher_id', teacherId)
        .eq('review_fingerprint', quality.fingerprint)
        .gte('created_at', duplicateSince.toISOString());
      if (duplicateError) throw duplicateError;
      if ((duplicateCount ?? 0) > 0) {
        throw new Error('You already submitted a very similar review for this teacher recently.');
      }

      const { error } = await supabase.from('reviews').insert({
        teacher_id: teacherId,
        user_id: userId,
        teaching_score: teachingScore,
        grading_score: gradingScore,
        attendance_score: attendanceScore,
        comment,
        is_anonymous: Boolean(payload.isAnonymous),
        quality_flags: quality.flags,
        moderation_priority: quality.priority,
        review_fingerprint: quality.fingerprint,
        approved: false,
      });
      if (error) throw error;

      return Response.json({ data: null }, { headers: corsHeaders });
    }

    if (action !== 'reportReview') {
      throw new Error(`Unknown review action: ${action}`);
    }

    const reviewId = payload.reviewId;
    if (!reviewId) throw new Error('Missing reviewId.');

    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('reported_count')
      .eq('id', reviewId)
      .single();
    if (fetchError) throw fetchError;

    const reportedCount = Number(review?.reported_count ?? 0) + 1;
    const { error } = await supabase
      .from('reviews')
      .update({
        reported: true,
        reported_count: reportedCount,
        moderation_priority: Math.min(100, 60 + reportedCount * 10),
      })
      .eq('id', reviewId);
    if (error) throw error;

    return Response.json({ data: null }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not report review.' },
      { status: 401, headers: corsHeaders },
    );
  }
});
