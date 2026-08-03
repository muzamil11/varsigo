/** Single source of truth for "is this email the admin" — used by both the
 *  authStore's isAdmin() selector (tab visibility) and every admin/api.ts
 *  call (client-side guard), so the two can't drift out of sync.
 *
 *  This is NOT a real security boundary: the app has no Supabase Auth
 *  session to key an RLS policy off of (see supabase/schema.sql's RLS
 *  notes), so anyone with the anon key can call the same tables directly.
 *  It only gates the UI and the api.ts functions client-side. Before this
 *  app has real users, move moderation behind a server that verifies the
 *  Firebase ID token and the admin email server-side. */
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.EXPO_PUBLIC_ADMIN_EMAIL;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedAdminEmail = adminEmail?.trim().toLowerCase();
  return Boolean(
    normalizedEmail && normalizedAdminEmail && normalizedEmail === normalizedAdminEmail,
  );
}
