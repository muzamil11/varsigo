import { callCommunityFunction, isCommunityFunctionConfigured } from '@/lib/communityFunction';
import { sanitizeText } from '@/lib/sanitize';
import { PAPERS_BUCKET, supabase, toFriendlyError } from '@/lib/supabase';
import type { Paper, PaperKind } from './data';

interface RawUploadRow {
  id: string;
  title: string;
  subject: string;
  year: number | null;
  type: PaperKind;
  file_url: string;
  file_urls: string[] | null;
  created_at: string;
  departments: { name: string } | null;
  users: { name: string | null } | null;
}

interface SignedUploadSlot {
  path: string;
  token: string;
  publicUrl: string;
}

export interface PaperFilters {
  departmentId?: string;
  year?: number;
  kind?: PaperKind;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export async function fetchPapers(filters: PaperFilters = {}): Promise<Paper[]> {
  try {
    let query = supabase
      .from('uploads')
      .select('id, title, subject, year, type, file_url, file_urls, created_at, departments(name), users(name)')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (filters.departmentId) query = query.eq('department_id', filters.departmentId);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.kind) query = query.eq('type', filters.kind);

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as unknown as RawUploadRow[]).map((u) => ({
      id: u.id,
      title: u.title,
      subject: u.subject,
      department: u.departments?.name ?? null,
      year: u.year,
      kind: u.type,
      fileUrl: u.file_url,
      fileUrls: u.file_urls?.length ? u.file_urls : [u.file_url],
      uploaderName: u.users?.name ?? 'Anonymous',
      createdAt: formatDate(u.created_at),
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface UploadPaperInput {
  userId: string;
  title: string;
  subject: string;
  departmentId: string | null;
  year: number | null;
  kind: PaperKind;
  files: File[];
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_TOTAL_BYTES = 30 * 1024 * 1024;
export const MAX_IMAGE_PAGES = 10;

async function removeUploadedFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  if (isCommunityFunctionConfigured()) {
    try {
      await callCommunityFunction<void>('deletePaperUploadFiles', { paths });
      return;
    } catch (error) {
      console.warn(
        '[papers] signed upload cleanup failed after upload error',
        error instanceof Error ? error.message : String(error),
      );
      return;
    }
  }

  const { error } = await supabase.storage.from(PAPERS_BUCKET).remove(paths);
  if (error) {
    console.warn('[papers] cleanup failed after upload error', error.message);
  }
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_');
}

async function createSignedUploadSlots(files: File[]): Promise<SignedUploadSlot[]> {
  const result = await callCommunityFunction<{ uploads: SignedUploadSlot[] }>(
    'createPaperUploadUrls',
    {
      files: files.map((file) => ({
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      })),
    },
  );
  return result.uploads;
}

/** Validates each file's size against the mobile app's same caps before
 *  attempting any upload — the browser gives us a File/Blob directly (no
 *  base64 round-trip needed here, unlike React Native's fetch().blob()
 *  bug), so this is simpler than the mobile equivalent. */
export function validateUploadFiles(files: File[]): string | null {
  if (files.length === 0) return 'Choose a PDF or at least one image.';
  if (files.length > MAX_IMAGE_PAGES) return `Choose at most ${MAX_IMAGE_PAGES} files.`;

  let total = 0;
  for (const file of files) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const limit = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return `"${file.name}" is too large (max ${Math.round(limit / (1024 * 1024))}MB).`;
    }
    total += file.size;
  }
  if (total > MAX_UPLOAD_TOTAL_BYTES) {
    return `Total upload size is too large (max ${Math.round(MAX_UPLOAD_TOTAL_BYTES / (1024 * 1024))}MB).`;
  }
  return null;
}

/** Uploads the file(s) to the "papers" storage bucket, then inserts the
 *  metadata row with approved: false — it appears in Papers only after
 *  moderation. */
export async function uploadPaper(input: UploadPaperInput): Promise<void> {
  const uploadedPaths: string[] = [];
  try {
    const validationError = validateUploadFiles(input.files);
    if (validationError) throw new Error(validationError);

    const uploadedUrls: string[] = [];
    const signedUploads = isCommunityFunctionConfigured()
      ? await createSignedUploadSlots(input.files)
      : null;
    if (signedUploads && signedUploads.length !== input.files.length) {
      throw new Error('Could not prepare upload. Please try again.');
    }

    for (const [index, file] of input.files.entries()) {
      const uploadSlot = signedUploads?.[index] ?? null;
      const path = uploadSlot?.path ?? `${input.userId}/${Date.now()}-${index + 1}-${safeFileName(file.name)}`;
      const { error: uploadError } = uploadSlot
        ? await supabase.storage
            .from(PAPERS_BUCKET)
            .uploadToSignedUrl(path, uploadSlot.token, file, {
              contentType: file.type || 'application/octet-stream',
            })
        : await supabase.storage
            .from(PAPERS_BUCKET)
            .upload(path, file, { contentType: file.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);

      if (uploadSlot) {
        uploadedUrls.push(uploadSlot.publicUrl);
      } else {
        const { data: publicUrlData } = supabase.storage.from(PAPERS_BUCKET).getPublicUrl(path);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    if (isCommunityFunctionConfigured()) {
      await callCommunityFunction<void>('submitPaperUpload', {
        title: input.title,
        subject: input.subject,
        departmentId: input.departmentId,
        year: input.year,
        kind: input.kind,
        fileUrl: uploadedUrls[0],
        fileUrls: uploadedUrls,
      });
    } else {
      const { error: insertError } = await supabase.from('uploads').insert({
        user_id: input.userId,
        title: sanitizeText(input.title),
        subject: sanitizeText(input.subject),
        department_id: input.departmentId,
        year: input.year,
        type: input.kind,
        file_url: uploadedUrls[0],
        file_urls: uploadedUrls,
        approved: false,
      });
      if (insertError) throw insertError;
    }
  } catch (error) {
    await removeUploadedFiles(uploadedPaths);
    throw new Error(toFriendlyError(error));
  }
}
