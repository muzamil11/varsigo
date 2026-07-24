import { firebaseAuth } from './firebase';

const communityFunctionUrl = process.env.NEXT_PUBLIC_COMMUNITY_FUNCTION_URL;

export function isCommunityFunctionConfigured(): boolean {
  return Boolean(communityFunctionUrl && communityFunctionUrl !== 'your_community_function_url');
}

export async function callCommunityFunction<T>(
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isCommunityFunctionConfigured() || !communityFunctionUrl) {
    throw new Error('Community function is not configured.');
  }

  const token = await firebaseAuth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Your session expired. Please log in again.');
  }

  const response = await fetch(communityFunctionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });
  const result = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error ?? 'Community action failed.');
  }
  return result?.data as T;
}
