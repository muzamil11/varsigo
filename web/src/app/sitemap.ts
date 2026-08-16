import type { MetadataRoute } from 'next';

import { fetchTeachers } from '@/features/teachers/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nedhub.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/teachers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/papers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/links`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const teachers = await fetchTeachers();
    const teacherRoutes: MetadataRoute.Sitemap = teachers.map((t) => ({
      url: `${SITE_URL}/teachers/${t.id}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    return [...staticRoutes, ...teacherRoutes];
  } catch {
    // Backend not configured yet (e.g. during a build without env vars) —
    // fall back to the static routes only rather than failing the build.
    return staticRoutes;
  }
}
