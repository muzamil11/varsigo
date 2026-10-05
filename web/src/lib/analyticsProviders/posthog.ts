import posthog from 'posthog-js';

import type { AnalyticsProvider } from '../analytics';

/** PostHog in anonymous-only mode: autocapture and session recording are
 *  both off (autocapture can scoop up form text / click content we never
 *  intended to send), and we never call posthog.identify() — so no email,
 *  name, or Supabase/Firebase user id ever reaches it. `person_profiles:
 *  'identified_only'` means an anonymous pageview/event doesn't even create
 *  a person profile; PostHog just tracks it against its own random,
 *  non-identifying distinct_id (stored client-side), which is exactly what
 *  "how many people came back" needs without being able to say who.
 *
 *  Lives in its own file (dynamically imported from analytics.ts) so the
 *  posthog-js package is never fetched/parsed at all unless analytics is
 *  actually enabled — not even its bytes ship to a browser in local dev. */
export class PostHogProvider implements AnalyticsProvider {
  private ready = false;

  init(key: string, host: string) {
    if (this.ready) return;
    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
    });
    this.ready = true;
  }

  page(path: string) {
    if (!this.ready) return;
    posthog.capture('$pageview', { $current_url: path });
  }

  track(event: string, props?: Record<string, unknown>) {
    if (!this.ready) return;
    posthog.capture(event, props);
  }
}
