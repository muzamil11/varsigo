import { firebaseAuth } from './firebase';

const deleteAccountFunctionUrl = process.env.EXPO_PUBLIC_DELETE_ACCOUNT_FUNCTION_URL;

export function isDeleteAccountFunctionConfigured(): boolean {
  return Boolean(
    deleteAccountFunctionUrl &&
      deleteAccountFunctionUrl !== 'your_delete_account_function_url',
  );
}

export async function callDeleteAccountFunction(): Promise<void> {
  if (!isDeleteAccountFunctionConfigured() || !deleteAccountFunctionUrl) {
    throw new Error('Account deletion is not configured yet.');
  }

  const token = await firebaseAuth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Your session expired. Please log in again.');
  }

  const response = await fetch(deleteAccountFunctionUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error ?? 'Account deletion failed.');
  }
}
