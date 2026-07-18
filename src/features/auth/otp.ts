import type { ApplicationVerifier, ConfirmationResult, User as FirebaseUser } from '@firebase/auth';
import { signInWithPhoneNumber } from '@firebase/auth';

import { firebaseAuth } from '@/lib/firebase';

/** Strict E.164 Pakistani mobile format: "+92" followed by exactly 10
 *  digits (13 characters total), e.g. +923001234567. */
export function isValidPakistaniPhone(phone: string): boolean {
  return /^\+92\d{10}$/.test(phone.trim());
}

/** Firebase requires E.164 (+923XXXXXXXXX); users type the local 03XX form. */
export function toE164(phone: string): string {
  const digits = phone.replace(/[\s-]/g, '');
  return digits.startsWith('+92') ? digits : `+92${digits.replace(/^0/, '')}`;
}

function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That phone number looks invalid. Use the format +92XXXXXXXXXX.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a while before trying again.';
    case 'auth/invalid-verification-code':
      return 'Incorrect code. Please check the SMS and try again.';
    case 'auth/code-expired':
      return 'This code has expired. Request a new one.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}

export async function sendOtp(
  phone: string,
  verifier: ApplicationVerifier,
): Promise<ConfirmationResult> {
  try {
    return await signInWithPhoneNumber(firebaseAuth, toE164(phone), verifier);
  } catch (error) {
    throw new Error(friendlyAuthError(error));
  }
}

export async function verifyOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<FirebaseUser> {
  try {
    const credential = await confirmation.confirm(code);
    return credential.user;
  } catch (error) {
    throw new Error(friendlyAuthError(error));
  }
}
