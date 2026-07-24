'use client';

import { GoogleAuthProvider, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';

import { firebaseAuth } from '@/lib/firebase';

function friendlyGoogleError(error: unknown): string {
  console.error('[google-signin]', error);
  const code = (error as { code?: string })?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in was cancelled.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for sign-in yet. Contact the site admin.';
  }
  const message = error instanceof Error ? error.message : String(error);
  return `Something went wrong: ${message}`;
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error) {
    throw new Error(friendlyGoogleError(error));
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    await signOut(firebaseAuth);
  } catch {
    // ignore — best-effort only
  }
}
