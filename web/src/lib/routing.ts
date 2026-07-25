import type { UserRow } from './database.types';

/** Central place for "where should this user land after an auth state
 *  change" — used by login (post-Google), onboarding-name (post-save), and
 *  privacy-notice (post-accept), so they don't drift out of sync: no user ->
 *  login, no name yet -> collect it, name but no privacy acceptance yet ->
 *  show the notice once, otherwise -> wherever they were trying to go
 *  before signing in (redirectTo), or home if there wasn't one.
 *
 *  redirectTo matters because a student can hit "Sign in" from deep inside
 *  the site (a teacher's review section, the upload form, Q&A) — without
 *  carrying that destination through the login/onboarding/privacy-notice
 *  chain, they'd land back on the homepage every time and have to
 *  navigate back to what they were doing. */
export function getPostAuthRoute(
  user: UserRow | null,
  privacyAccepted: boolean,
  redirectTo?: string | null,
): string {
  if (!user) return '/login';
  if (!user.name) return '/onboarding-name';
  if (!privacyAccepted) return '/privacy-notice';
  return redirectTo || '/';
}

/** Appends the current path as a `redirect` query param onto an auth-chain
 *  route (login, onboarding-name, privacy-notice), so whichever step comes
 *  next can keep carrying it forward. */
export function withRedirect(path: string, redirectTo?: string | null): string {
  if (!redirectTo) return path;
  return `${path}?redirect=${encodeURIComponent(redirectTo)}`;
}
