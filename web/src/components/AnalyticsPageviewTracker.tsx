'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { initAnalytics, trackPageview } from '@/lib/analytics';

/** Mounted once in the root layout — initializes analytics (a no-op unless
 *  NEXT_PUBLIC_ANALYTICS_ENABLED is set) and fires a pageview on every
 *  route change. Deliberately uses only `usePathname()`, not
 *  `useSearchParams()` — the latter would force every page in the app out
 *  of static rendering. Renders nothing. */
export function AnalyticsPageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageview(pathname);
  }, [pathname]);

  return null;
}
