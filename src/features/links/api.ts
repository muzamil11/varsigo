import { isAdminEmail } from '@/lib/admin';
import { sanitizeText } from '@/lib/sanitize';
import { supabase, toFriendlyError } from '@/lib/supabase';
import { fetchModerationSettings } from '@/features/settings/api';
import type { ImportantLink, PendingImportantLink } from './data';

/** Re-checks the caller's email against EXPO_PUBLIC_ADMIN_EMAIL before
 *  touching the database — see src/lib/admin.ts for why this is a
 *  client-side gate, not a real security boundary (same pattern as every
 *  other admin-only call in src/features/admin/api.ts). */
function assertAdmin(email: string | null | undefined) {
  if (!isAdminEmail(email)) {
    throw new Error('Not authorized: admin access only.');
  }
}

function assertValidUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Link must start with http:// or https://');
  }
}

/** Approved, general (non-folder) links only — what Home and the "Important
 *  Links" page show. Folder-scoped links are fetched separately via
 *  fetchFolderLinks and shown on that subject's Papers folder page instead. */
export async function fetchImportantLinks(): Promise<ImportantLink[]> {
  try {
    const { data, error } = await supabase
      .from('important_links')
      .select('id, title, subtitle, url')
      .eq('approved', true)
      .is('folder_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ImportantLink[];
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Approved links scoped to one subject folder — shown on that folder's
 *  Papers page (e.g. a Drive link with lecture notes for that subject). */
export async function fetchFolderLinks(folderId: string): Promise<ImportantLink[]> {
  try {
    const { data, error } = await supabase
      .from('important_links')
      .select('id, title, subtitle, url')
      .eq('approved', true)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ImportantLink[];
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** All approved links regardless of folder — used by the admin Links panel
 *  so admin can see/manage both general and folder-scoped links in one
 *  place (fetchImportantLinks itself stays general-only for Home). */
export async function fetchAllImportantLinks(adminEmail: string): Promise<ImportantLink[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('important_links')
      .select('id, title, subtitle, url, folder_id')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as (ImportantLink & { folder_id: string | null })[]).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      url: row.url,
      folderId: row.folder_id,
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface AddImportantLinkInput {
  adminEmail: string;
  title: string;
  url: string;
  subtitle?: string;
  folderId?: string | null;
}

/** Admin adding a link directly — goes live immediately, no approval step. */
export async function addImportantLink(input: AddImportantLinkInput): Promise<void> {
  assertAdmin(input.adminEmail);
  const url = input.url.trim();
  assertValidUrl(url);
  try {
    const { error } = await supabase.from('important_links').insert({
      title: sanitizeText(input.title),
      subtitle: input.subtitle?.trim() ? sanitizeText(input.subtitle) : null,
      url,
      folder_id: input.folderId ?? null,
      approved: true,
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface SuggestImportantLinkInput {
  userId: string;
  title: string;
  url: string;
  subtitle?: string;
  folderId?: string | null;
}

/** Any signed-in student can suggest a link (e.g. a class WhatsApp group, or
 *  from the paper-upload screen's "share a link" mode) — inserted
 *  unapproved, only visible to admin until approved. A student never picks
 *  folderId directly; the upload screen only passes a subject hint via
 *  subtitle, same as papers (folders are admin-assigned). */
export async function suggestImportantLink(input: SuggestImportantLinkInput): Promise<void> {
  const url = input.url.trim();
  assertValidUrl(url);
  try {
    const { importantLinksRequireApproval } = await fetchModerationSettings();
    const { error } = await supabase.from('important_links').insert({
      title: sanitizeText(input.title),
      subtitle: input.subtitle?.trim() ? sanitizeText(input.subtitle) : null,
      url,
      user_id: input.userId,
      folder_id: input.folderId ?? null,
      approved: !importantLinksRequireApproval,
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

interface RawPendingLinkRow {
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
  folder_id: string | null;
  created_at: string;
  users: { name: string | null; email: string | null } | null;
}

export async function fetchPendingImportantLinks(adminEmail: string): Promise<PendingImportantLink[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('important_links')
      .select('id, title, subtitle, url, folder_id, created_at, users(name, email)')
      .eq('approved', false)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as RawPendingLinkRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      url: row.url,
      folderId: row.folder_id,
      submittedBy: row.users?.name || row.users?.email || 'Unknown',
      createdAt: new Date(row.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function approveImportantLink(adminEmail: string, linkId: string): Promise<void> {
  assertAdmin(adminEmail);
  try {
    const { error } = await supabase
      .from('important_links')
      .update({ approved: true })
      .eq('id', linkId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Assigns (or clears, with folderId null) which subject folder a link
 *  belongs to — used by admin to sort a pending/approved link onto its
 *  Papers folder page, same two-step pattern as uploads.folder_id. */
export async function updateImportantLinkFolder(
  adminEmail: string,
  linkId: string,
  folderId: string | null,
): Promise<void> {
  assertAdmin(adminEmail);
  try {
    const { error } = await supabase
      .from('important_links')
      .update({ folder_id: folderId })
      .eq('id', linkId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Deletes a link outright — used by admin both to reject a pending
 *  suggestion and to remove an already-approved link. */
export async function deleteImportantLink(adminEmail: string, linkId: string): Promise<void> {
  assertAdmin(adminEmail);
  try {
    const { error } = await supabase.from('important_links').delete().eq('id', linkId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}
