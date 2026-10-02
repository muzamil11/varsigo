export interface ImportantLink {
  id: string;
  title: string;
  subtitle?: string | null;
  url: string;
  folderId?: string | null;
}

/** A user-submitted link awaiting admin approval — see admin/links/page.tsx. */
export interface PendingImportantLink extends ImportantLink {
  submittedBy: string;
  createdAt: string;
}
