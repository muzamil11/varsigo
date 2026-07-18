import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

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

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

function contentTypeFor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/** Decodes a base64 string into raw bytes for the storage upload below.
 *  `fetch(uri).blob()` does not reliably carry binary data through to
 *  Supabase's storage upload on React Native (observed as 0-byte objects,
 *  content-length: 0) — reading the file via expo-file-system as base64 and
 *  uploading the decoded bytes avoids that. Note: this deliberately does NOT
 *  use the DOM `atob()` global — it isn't polyfilled in this project's
 *  React Native/Hermes runtime and would throw at runtime, so we use the
 *  `base64-arraybuffer` package instead. */
function decode(base64: string): Uint8Array {
  return new Uint8Array(decodeBase64(base64));
}

export interface UploadPaperInput {
  userId: string;
  title: string;
  subject: string;
  departmentId: string | null;
  year: number | null;
  kind: PaperKind;
  files: { uri: string; name: string }[];
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_TOTAL_BYTES = 30 * 1024 * 1024;
export const MAX_IMAGE_PAGES = 10;

/** Uploads the file (PDF as-is, images pre-compressed by the caller) to the
 *  "papers" storage bucket, then inserts the metadata row with approved:
 *  false — it appears in Papers only after moderation. */
export async function uploadPaper(input: UploadPaperInput): Promise<void> {
  try {
    if (input.files.length === 0) {
      throw new Error('Choose a PDF or at least one image.');
    }

    const uploadedUrls: string[] = [];
    const batchId = Date.now();

    for (const [index, file] of input.files.entries()) {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${input.userId}/${batchId}-${index + 1}-${safeName}`;
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from(PAPERS_BUCKET)
        .upload(path, bytes, { contentType: contentTypeFor(safeName) });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(PAPERS_BUCKET).getPublicUrl(path);
      uploadedUrls.push(publicUrlData.publicUrl);
    }

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
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}
