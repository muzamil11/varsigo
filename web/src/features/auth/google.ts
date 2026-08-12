'use client';

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';

import { firebaseAuth, firebaseAuthReady } from '@/lib/firebase';

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

/** Starts sign-in via popup on every device, including mobile — the
 *  full-page redirect flow this used to prefer on mobile (screen width
 *  < 768) depends on Firebase's authDomain (`*.firebaseapp.com`) storing
 *  cookies/storage during the Google round trip to signal completion back
 *  on this origin. Mobile Chrome's storage partitioning increasingly breaks
 *  that handoff silently: the user picks their Google account, lands back
 *  on /login, and getRedirectResult() just resolves null — no error, no
 *  sign-in. Popup doesn't have that cross-origin dependency, and modern
 *  mobile Chrome opens it as a normal tab rather than a broken tiny window.
 *  Redirect is kept only as a fallback for environments where the popup
 *  itself can't open (in-app webviews, popup blockers). */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  await firebaseAuthReady;
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      try {
        await signInWithRedirect(firebaseAuth, provider);
        return null;
      } catch (redirectError) {
        throw new Error(friendlyGoogleError(redirectError));
      }
    }
    throw new Error(friendlyGoogleError(error));
  }
}

/** Call once when the login page mounts — completes sign-in if the browser
 *  just landed back here after signInWithGoogle()'s mobile redirect.
 *  Resolves to null on a normal (non-redirect) page load. */
export async function completeGoogleRedirectSignIn(): Promise<FirebaseUser | null> {
  try {
    await firebaseAuthReady;
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
