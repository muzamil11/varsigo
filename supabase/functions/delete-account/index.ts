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
  if (!response.ok || !phone) {
    throw new Error('Not authorized.');
  }
  return phone;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const phone = await getVerifiedPhone(req.headers.get('Authorization'));
    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.from('users').delete().eq('phone', phone);
    if (error) throw error;

    return Response.json({ data: null }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Account deletion failed.' },
      { status: 401, headers: corsHeaders },
    );
  }
});
