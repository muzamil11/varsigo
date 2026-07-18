import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizeText(input: unknown): string {
  return String(input ?? '').trim().replace(/<[^>]*>/g, '');
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function verifyAdminEmail(authHeader: string | null): Promise<void> {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Missing Firebase token.');

  const firebaseApiKey = requiredEnv('FIREBASE_API_KEY');
  const adminEmail = requiredEnv('ADMIN_EMAIL');
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  );

  const data = await response.json();
  const email = data?.users?.[0]?.email;
  if (!response.ok || email !== adminEmail) {
    throw new Error('Not authorized.');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    await verifyAdminEmail(req.headers.get('Authorization'));

    const { action, payload = {} } = await req.json();
    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );

    let error: { message: string } | null = null;

    switch (action) {
      case 'approveReview':
        ({ error } = await supabase
          .from('reviews')
          .update({ approved: true })
          .eq('id', payload.reviewId));
        break;
      case 'rejectReview':
        ({ error } = await supabase.from('reviews').delete().eq('id', payload.reviewId));
        break;
      case 'approveUpload':
        ({ error } = await supabase
          .from('uploads')
          .update({ approved: true })
          .eq('id', payload.uploadId));
        break;
      case 'rejectUpload':
        ({ error } = await supabase.from('uploads').delete().eq('id', payload.uploadId));
        break;
      case 'addDepartment':
        ({ error } = await supabase.from('departments').insert({
          name: sanitizeText(payload.name),
          university: 'NED',
        }));
        break;
      case 'deleteDepartment':
        ({ error } = await supabase.from('departments').delete().eq('id', payload.departmentId));
        break;
      case 'addTeacher': {
        const insert = await supabase
          .from('teachers')
          .insert({
            name: sanitizeText(payload.name),
            department_id: payload.departmentId,
            university: 'NED',
            verification_status: 'admin_verified',
            verified_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (insert.error) throw insert.error;

        const courseIds = Array.isArray(payload.courseIds) ? payload.courseIds : [];
        if (courseIds.length > 0) {
          ({ error } = await supabase.from('teacher_courses').insert(
            courseIds.map((courseId: string) => ({
              teacher_id: insert.data.id,
              course_id: courseId,
            })),
          ));
        }
        break;
      }
      case 'deleteTeacher':
        ({ error } = await supabase.from('teachers').delete().eq('id', payload.teacherId));
        break;
      case 'addCourse':
        ({ error } = await supabase.from('courses').insert({
          name: sanitizeText(payload.name),
          code: payload.code ? sanitizeText(payload.code).toUpperCase() : null,
          department_id: payload.departmentId,
          university: 'NED',
        }));
        break;
      case 'deleteCourse':
        ({ error } = await supabase.from('courses').delete().eq('id', payload.courseId));
        break;
      case 'assignTeacherCourse':
        ({ error } = await supabase
          .from('teacher_courses')
          .upsert(
            { teacher_id: payload.teacherId, course_id: payload.courseId },
            { onConflict: 'teacher_id,course_id' },
          ));
        break;
      case 'approveTeacherSuggestion': {
        const suggestion = payload.suggestion;
        if (!suggestion?.departmentId) throw new Error('Suggestion has no department set.');

        const insert = await supabase.from('teachers').insert({
          name: sanitizeText(suggestion.name),
          department_id: suggestion.departmentId,
          university: 'NED',
          verification_status: 'suggestion_approved',
          verified_at: new Date().toISOString(),
        });
        if (insert.error) throw insert.error;

        ({ error } = await supabase
          .from('teacher_suggestions')
          .delete()
          .eq('id', suggestion.id));
        break;
      }
      case 'rejectTeacherSuggestion':
        ({ error } = await supabase
          .from('teacher_suggestions')
          .delete()
          .eq('id', payload.suggestionId));
        break;
      case 'dismissCommunityReport': {
        const report = payload.report;
        const table = report?.kind === 'question' ? 'questions' : 'answers';
        ({ error } = await supabase
          .from(table)
          .update({ reported: false, reported_count: 0, moderation_priority: 0 })
          .eq('id', report?.id));
        break;
      }
      case 'hideCommunityItem': {
        const report = payload.report;
        const table = report?.kind === 'question' ? 'questions' : 'answers';
        ({ error } = await supabase.from(table).update({ status: 'hidden' }).eq('id', report?.id));
        break;
      }
      default:
        throw new Error(`Unknown admin action: ${action}`);
    }

    if (error) throw error;
    return Response.json({ data: null }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Admin action failed.' },
      { status: 401, headers: corsHeaders },
    );
  }
});
