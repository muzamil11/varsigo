import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/papers', '/faq', '/links', '/about', '/contact', '/terms', '/privacy-policy'],
      // Gated pages have no content worth indexing (sign-in prompt only).
      // Teachers (and its reviews) is deliberately sign-in-only — it's
      // opinion content about identifiable people, not a resource library
      // like Papers — so it stays out of search entirely, not just logged
      // out of the crawl-friendly tier. Admin is not for public discovery.
      disallow: [
        '/admin',
        '/teachers',
        '/questions',
        '/login',
        '/onboarding-name',
        '/privacy-notice',
        '/papers/upload',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
