'use client';

import { useEffect, useRef } from 'react';

import { trackEvent } from './analytics';

const DEBOUNCE_MS = 600;

/** Fires a `search_used` event DEBOUNCE_MS after the user stops typing in a
 *  search box — never the raw query text (could be anything a student
 *  typed), just which feature it was and how long the query was. Shared by
 *  every SearchBar usage (Papers, Teachers, FAQ, Lost & Found) instead of
 *  duplicating the debounce logic in each. */
export function useSearchTracking(feature: string, query: string): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const trimmed = query.trim();
    if (trimmed.length === 0) return undefined;
    timer.current = setTimeout(() => {
      trackEvent('search_used', { feature, query_length: trimmed.length });
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [feature, query]);
}
