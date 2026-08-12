export interface ImportantLink {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  /** True while the link isn't ready yet — renders as a disabled "Coming
   *  soon" card instead of something that would 404 or open a dead page. */
  comingSoon?: boolean;
}

/** Admin-curated external resources shown on the homepage's "Important
 *  Links" section — plain static list, no backend/DB needed since these
 *  rarely change. Add new entries here as they come in. */
export const IMPORTANT_LINKS: ImportantLink[] = [
  {
    id: 'past-papers-drive',
    title: 'Past Papers Drive',
    subtitle: 'Full archive shared by students',
    url: '',
    comingSoon: true,
  },
];
