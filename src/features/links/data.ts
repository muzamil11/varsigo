export interface ImportantLink {
  id: string;
  title: string;
  subtitle?: string | null;
  url: string;
}

/** A user-submitted link awaiting admin approval — see AdminLinksPanel. */
export interface PendingImportantLink extends ImportantLink {
  submittedBy: string;
  createdAt: string;
}
