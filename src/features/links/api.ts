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

/** Approved links only — what Home and the "Important Links" page show. */
export async function fetchImportantLinks(): Promise<ImportantLink[]> {
  try {
    const { data, error } = await supabase
      .from('important_links')
      .select('id, title, subtitle, url')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ImportantLink[];
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface AddImportantLinkInput {
  adminEmail: string;
  title: string;
  url: string;
  subtitle?: string;
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
}

/** Any signed-in student can suggest a link (e.g. a class WhatsApp group) —
 *  inserted unapproved, only visible to admin until approved. */
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
  created_at: string;
  users: { name: string | null; email: string | null } | null;
}

export async function fetchPendingImportantLinks(adminEmail: string): Promise<PendingImportantLink[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('important_links')
      .select('id, title, subtitle, url, created_at, users(name, email)')
      .eq('approved', false)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as RawPendingLinkRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      url: row.url,
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
