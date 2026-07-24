import type { UserRow } from './database.types';

export type PostAuthRoute = '/login' | '/onboarding-name' | '/privacy-notice' | '/';

/** Central place for "where should this user land after an auth state
 *  change" — used by login (post-Google), onboarding-name (post-save), and
 *  the gated layout, so they don't drift out of sync: no user -> login, no
 *  name yet -> collect it, name but no privacy acceptance yet -> show the
 *  notice once, otherwise -> the app itself. */
export function getPostAuthRoute(user: UserRow | null, privacyAccepted: boolean): PostAuthRoute {
  if (!user) return '/login';
  if (!user.name) return '/onboarding-name';
  if (!privacyAccepted) return '/privacy-notice';
  return '/';
}
