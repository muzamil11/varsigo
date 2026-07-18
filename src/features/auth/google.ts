import { GoogleAuthProvider, signInWithCredential, type User as FirebaseUser } from '@firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { firebaseAuth } from '@/lib/firebase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

function friendlyGoogleError(error: unknown): string {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.IN_PROGRESS:
        return 'Sign-in is already in progress.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is not available on this device.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      throw new Error('Sign-in was cancelled.');
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google did not return a sign-in token. Please try again.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(firebaseAuth, credential);
    return userCredential.user;
  } catch (error) {
    throw new Error(friendlyGoogleError(error));
  }
}

/** Best-effort — clears the native Google session too, so the account
 *  picker shows up again next time instead of silently reusing this one. */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — local sign-out only matters for a smoother next sign-in
  }
}
