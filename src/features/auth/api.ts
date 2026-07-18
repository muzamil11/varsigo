import { sanitizeText } from '@/lib/sanitize';
import { callCommunityFunction, isCommunityFunctionConfigured } from '@/lib/communityFunction';
import { supabase, toFriendlyError } from '@/lib/supabase';
import type { UserRow } from '@/lib/database.types';

export interface GoogleIdentity {
  firebaseUid: string;
  email: string;
}

/** Creates the users row on first login, or fetches the existing one by
 *  Firebase UID (the stable identity Google Sign-In verifies). */
export async function upsertUserByGoogle(identity: GoogleIdentity): Promise<UserRow> {
  if (isCommunityFunctionConfigured()) {
    return callCommunityFunction<UserRow>('getOrCreateUser', {
      firebaseUid: identity.firebaseUid,
      email: identity.email,
    });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { firebase_uid: identity.firebaseUid, email: identity.email },
        { onConflict: 'firebase_uid', ignoreDuplicates: false },
      )
      .select()
      .single();

    if (error) throw error;
    return data as UserRow;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Saves the display name collected right after first login. */
export async function updateUserName(userId: string, name: string): Promise<UserRow> {
  if (isCommunityFunctionConfigured()) {
    return callCommunityFunction<UserRow>('updateUserName', { name });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ name: sanitizeText(name) })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserRow;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function deleteUserRow(userId: string): Promise<void> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}
