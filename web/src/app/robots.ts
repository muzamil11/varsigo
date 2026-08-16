import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nedhub.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/teachers', '/papers', '/faq', '/links'],
      // Gated pages have no content worth indexing (sign-in prompt only)
      // and admin is not for public discovery.
      disallow: [
        '/admin',
        '/questions',
        '/login',
        '/onboarding-name',
        '/privacy-notice',
        '/papers/upload',
        '/teachers/*/add-review',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
