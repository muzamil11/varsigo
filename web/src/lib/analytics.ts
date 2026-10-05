// Single on/off switch + provider config for product analytics. Swapping
// providers later (or adding a second one) means writing a new
// AnalyticsProvider (see analyticsProviders/posthog.ts for the shape) and
// changing the dynamic import in initAnalytics() below — trackEvent and
// trackPageview, used everywhere else, never change.
//
// Analytics is a strict no-op unless BOTH are true:
//   - NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
//   - we're actually running a production build (NODE_ENV === 'production')
// The second check can't be overridden by an env var — local dev never
// sends real events, and the posthog-js package itself is never even
// fetched (see the dynamic import below) when this is false.
const ANALYTICS_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true' && process.env.NODE_ENV === 'production',
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
};

export interface AnalyticsProvider {
  init(key: string, host: string): void;
  page(path: string): void;
  track(event: string, props?: Record<string, unknown>): void;
}

let provider: AnalyticsProvider | null = null;
let initStarted = false;
// The very first pageview (fired from AnalyticsPageviewTracker's mount
// effect) almost always races the dynamic import below — queue it instead
// of silently dropping it. Later trackEvent/trackPageview calls happen
// well after mount (a user has to click something first), so they don't
// need the same treatment.
let pendingPageview: string | null = null;

/** Call once on app mount (see AnalyticsPageviewTracker in the root
 *  layout). Safe to call more than once — only the first call does
 *  anything. Dynamically imports the PostHog provider so its code never
 *  ships to the browser at all unless analytics is actually enabled. */
export function initAnalytics(): void {
  if (!ANALYTICS_CONFIG.enabled || initStarted || !ANALYTICS_CONFIG.posthogKey) return;
  initStarted = true;
  const key = ANALYTICS_CONFIG.posthogKey;
  const host = ANALYTICS_CONFIG.posthogHost;
  void import('./analyticsProviders/posthog').then(({ PostHogProvider }) => {
    provider = new PostHogProvider();
    provider.init(key, host);
    if (pendingPageview) {
      provider.page(pendingPageview);
      pendingPageview = null;
    }
  });
}

export function trackPageview(path: string): void {
  if (!ANALYTICS_CONFIG.enabled) return;
  if (!provider) {
    pendingPageview = path;
    return;
  }
  provider.page(path);
}

/** Fire-and-forget custom event. `props` must never include email, name, or
 *  any id that identifies a real person. Keep names snake_case
 *  `feature_action` (see call sites in features/*\/api.ts and the
 *  login/upload/review/question flows for the established event list). */
export function trackEvent(event: string, props?: Record<string, unknown>): void {
  if (!ANALYTICS_CONFIG.enabled || !provider) return;
  provider.track(event, props);
}
