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

async function verifyFirebaseToken(authHeader: string | null): Promise<void> {
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
  if (!response.ok) throw new Error('Not authorized.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    await verifyFirebaseToken(req.headers.get('Authorization'));
    const { reviewId } = await req.json();
    if (!reviewId) throw new Error('Missing reviewId.');

    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );

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
