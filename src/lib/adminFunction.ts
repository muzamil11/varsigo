import { firebaseAuth } from './firebase';

const adminFunctionUrl = process.env.EXPO_PUBLIC_ADMIN_FUNCTION_URL;

export function isAdminFunctionConfigured(): boolean {
  return Boolean(adminFunctionUrl && adminFunctionUrl !== 'your_supabase_admin_function_url');
}

export async function callAdminFunction<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!isAdminFunctionConfigured() || !adminFunctionUrl) {
    throw new Error('Admin function is not configured.');
  }

  const token = await firebaseAuth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Your admin session expired. Please log in again.');
  }

  const response = await fetch(adminFunctionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  const result = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error ?? 'Admin request failed.');
  }

  return result?.data as T;
}
