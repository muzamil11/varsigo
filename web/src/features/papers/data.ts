// Domain types shared by the Papers feature's pages and components. Real
// data comes from src/features/papers/api.ts (Supabase "uploads" table +
// "papers" storage bucket) — see supabase/schema.sql.

export type PaperKind = 'past_paper' | 'notes';

export interface Paper {
  id: string;
  title: string;
  subject: string;
  department: string | null;
  year: number | null;
  kind: PaperKind;
  fileUrl: string;
  fileUrls: string[];
  uploaderName: string;
  createdAt: string;
  questionCount: number;
}

export const PAPER_KIND_LABELS: Record<PaperKind, string> = {
  past_paper: 'Past Paper',
  notes: 'Notes',
};

export const PAPER_YEARS = ['All', '2026', '2025', '2024', '2023', '2022'] as const;
export const PAPER_KIND_FILTERS = ['All', 'past_paper', 'notes'] as const;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];

/** The "uploads" table has no dedicated file-type column — the file's
 *  extension in its storage URL is the only signal available, so derive the
 *  icon/handling type from that instead of adding a migration for one flag. */
export function getPaperFileType(fileUrl: string): 'pdf' | 'image' {
  const ext = fileUrl.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'pdf';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Supabase Storage public URLs are cross-origin from the web app, so the
 *  anchor `download` attribute is ignored by the browser and the file just
 *  opens in a new tab instead of saving. Appending `?download=<name>` makes
 *  Supabase itself send `Content-Disposition: attachment`, which works
 *  regardless of origin. */
export function buildDownloadUrl(fileUrl: string, filename: string): string {
  try {
    const url = new URL(fileUrl);
    url.searchParams.set('download', filename.replace(/[^\w.-]+/g, '_'));
    return url.toString();
  } catch {
    return fileUrl;
  }
}
