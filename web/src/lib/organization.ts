// Single source of truth for the "built for <org>" credit shown in the
// Footer and Home hero (see OrgBadge.tsx). NEDHub isn't an official NED
// University product — it's built by a NED CS&IT student for the NED
// CS&IT community — so this stays explicit rather than implied.
//
// Reusing this app for a different campus/department later is meant to be
// a one-file edit: change the values here (and the gradient, if the new
// org's identity calls for a different one) and every place that renders
// OrgBadge picks it up automatically.
export interface OrganizationConfig {
  /** Shown next to the mark, e.g. "NED CS&IT". */
  name: string;
  /** Eyebrow label above `name` in the full badge, e.g. "Built for". */
  tagline: string;
  /** Appended after "© <year> NEDHub — " in the Footer's bottom line. */
  disclaimer: string;
  /** Mark chip gradient, dark corner to light corner. */
  gradientFrom: string;
  gradientTo: string;
}

export const ORGANIZATION: OrganizationConfig = {
  name: 'NED CS&IT',
  tagline: 'Built for',
  disclaimer:
    'built for the NED CS&IT community by a NED CS&IT student, not an official NED University product.',
  gradientFrom: '#13233F',
  gradientTo: '#6366F1',
};
