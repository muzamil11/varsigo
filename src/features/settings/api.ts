import { isAdminEmail } from '@/lib/admin';
import { supabase, toFriendlyError } from '@/lib/supabase';
import type { ModerationSettings } from './data';

/** Safe default if the settings row can't be read (e.g. schema not
 *  migrated yet) — submissions should stay gated behind approval rather
 *  than silently starting to auto-publish because this fetch failed. */
const SAFE_DEFAULTS: ModerationSettings = {
  reviewsRequireApproval: true,
  uploadsRequireApproval: true,
  teacherSuggestionsRequireApproval: true,
  importantLinksRequireApproval: true,
};

interface RawModerationSettingsRow {
  reviews_require_approval: boolean;
  uploads_require_approval: boolean;
  teacher_suggestions_require_approval: boolean;
  important_links_require_approval: boolean;
}

/** Every submission function (submitReview, uploadPaper, suggestTeacher,
 *  suggestImportantLink) calls this before inserting, so a single toggle
 *  here changes future-submission behavior instantly with no code change —
 *  see AdminSettingsPanel for the on/off switches themselves. */
export async function fetchModerationSettings(): Promise<ModerationSettings> {
  try {
    const { data, error } = await supabase
      .from('moderation_settings')
      .select(
        'reviews_require_approval, uploads_require_approval, teacher_suggestions_require_approval, important_links_require_approval',
      )
      .eq('id', true)
      .single();
    if (error || !data) return SAFE_DEFAULTS;
    const row = data as RawModerationSettingsRow;
    return {
      reviewsRequireApproval: row.reviews_require_approval,
      uploadsRequireApproval: row.uploads_require_approval,
      teacherSuggestionsRequireApproval: row.teacher_suggestions_require_approval,
      importantLinksRequireApproval: row.important_links_require_approval,
    };
  } catch {
    return SAFE_DEFAULTS;
  }
}

function assertAdmin(email: string | null | undefined) {
  if (!isAdminEmail(email)) {
    throw new Error('Not authorized: admin access only.');
  }
}

export async function updateModerationSettings(
  adminEmail: string,
  patch: Partial<ModerationSettings>,
): Promise<void> {
  assertAdmin(adminEmail);
  const dbPatch: Record<string, boolean> = {};
  if (patch.reviewsRequireApproval !== undefined) {
    dbPatch.reviews_require_approval = patch.reviewsRequireApproval;
  }
  if (patch.uploadsRequireApproval !== undefined) {
    dbPatch.uploads_require_approval = patch.uploadsRequireApproval;
  }
  if (patch.teacherSuggestionsRequireApproval !== undefined) {
    dbPatch.teacher_suggestions_require_approval = patch.teacherSuggestionsRequireApproval;
  }
  if (patch.importantLinksRequireApproval !== undefined) {
    dbPatch.important_links_require_approval = patch.importantLinksRequireApproval;
  }
  try {
    const { error } = await supabase.from('moderation_settings').update(dbPatch).eq('id', true);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}
