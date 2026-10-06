import type { MetadataRoute } from 'next';

import { fetchPaperFolders } from '@/features/papers/api';
import { SITE_URL } from '@/lib/site';

// Teachers (and its reviews) is sign-in-only by design — opinion content
// about identifiable people, not a public resource library — so it's
// deliberately left out of the sitemap, same reasoning as robots.ts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/papers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/links`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/about`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const folders = await fetchPaperFolders();
    const folderRoutes: MetadataRoute.Sitemap = folders.map((f) => ({
      url: `${SITE_URL}/papers/folder/${f.id}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    return [...staticRoutes, ...folderRoutes];
  } catch {
    // Backend not configured yet (e.g. during a build without env vars) —
    // fall back to the static routes only rather than failing the build.
    return staticRoutes;
  }
}
