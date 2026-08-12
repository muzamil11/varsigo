'use client';

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';

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

/** Popups render as a tiny, badly-positioned window (or get silently
 *  blocked outright) on mobile browsers — the full-page redirect flow is
 *  what Firebase itself recommends there instead. Matches the Header's own
 *  `md:` breakpoint for "is this a mobile layout". */
function shouldUseRedirect(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

/** Starts sign-in. On desktop this resolves with the signed-in user
 *  directly (popup flow). On mobile it navigates the whole page to Google
 *  and resolves to null — the browser lands back on /login afterwards,
 *  where completeGoogleRedirectSignIn() picks up the result. */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const provider = new GoogleAuthProvider();
    if (shouldUseRedirect()) {
      await signInWithRedirect(firebaseAuth, provider);
      return null;
    }
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error) {
    throw new Error(friendlyGoogleError(error));
  }
}

/** Call once when the login page mounts — completes sign-in if the browser
 *  just landed back here after signInWithGoogle()'s mobile redirect.
 *  Resolves to null on a normal (non-redirect) page load. */
export async function completeGoogleRedirectSignIn(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(firebaseAuth);
    return result?.user ?? null;
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
