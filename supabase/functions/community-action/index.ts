import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
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

async function getOrCreateUserId(supabase: ReturnType<typeof createClient>, phone: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .upsert({ phone }, { onConflict: 'phone', ignoreDuplicates: false })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function updateCount(
  supabase: ReturnType<typeof createClient>,
  table: 'questions' | 'answers',
  id: string,
  column: 'upvote_count' | 'reported_count',
  count: number,
  extra: Record<string, unknown> = {},
) {
  const { error } = await supabase.from(table).update({ [column]: count, ...extra }).eq('id', id);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const phone = await getVerifiedPhone(req.headers.get('Authorization'));
    const { action, payload = {} } = await req.json();
    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
    const userId = await getOrCreateUserId(supabase, phone);

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
