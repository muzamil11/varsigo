/** Single source of truth for the site's public base URL — used for
 *  metadataBase, robots.ts, sitemap.ts, and OG tags, so they can't drift
 *  out of sync. Set NEXT_PUBLIC_SITE_URL once the production domain is
 *  final; falls back to the default Vercel deployment URL. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nedhub.vercel.app';
