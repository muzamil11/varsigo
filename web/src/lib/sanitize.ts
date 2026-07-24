/** Trims whitespace and strips HTML tags from free-text user input before it
 *  reaches the database. Applied at the data layer (each feature's api.ts),
 *  not just in forms' onChange, so it can't be bypassed by any caller. */
export function sanitizeText(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '');
}
