import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.local.example to .env.local and fill them in, then restart `expo start`.',
  );
}

// Auth is not used here — NEDHub authenticates via Firebase (Google
// Sign-In), not Supabase Auth — so session persistence is disabled to avoid
// pulling in an AsyncStorage adapter for a session that never exists.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

export const PAPERS_BUCKET = 'papers';

/** Friendly text for the try/catch blocks scattered across the data layer. */
export function toFriendlyError(error: unknown): string {
  if (!isSupabaseConfigured) {
    return 'Backend is not configured yet. Add your Supabase keys to .env.local.';
  }
  if (error instanceof Error) {
    if (/network|fetch/i.test(error.message)) {
      return 'Network error — check your connection and try again.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
