import AsyncStorage from '@react-native-async-storage/async-storage';
// Deliberately '@firebase/auth', not 'firebase/auth': the 'firebase' wrapper
// package's own exports map for "./auth" has no "react-native" condition
// (verified in node_modules — only node/browser/default), so it silently
// resolves to the browser bundle in Metro and getReactNativePersistence
// isn't there. '@firebase/auth' (the underlying SDK package) has a proper
// "react-native" condition pointing at a build that includes it. Every other
// firebase/auth import in this app (google.ts, (tabs)/index.tsx) uses
// '@firebase/auth' too, so only one auth module registers itself.
import { getReactNativePersistence, initializeAuth } from '@firebase/auth';
import { initializeApp } from 'firebase/app';

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId,
  // Derived rather than a separate env var — every Firebase project's auth
  // domain is <projectId>.firebaseapp.com unless you've set up a custom domain.
  authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

if (!isFirebaseConfigured) {
  console.warn(
    '[firebase] EXPO_PUBLIC_FIREBASE_API_KEY / _PROJECT_ID / _APP_ID are not set. ' +
      'Google Sign-In will not work until .env.local is filled in and `expo start` is restarted.',
  );
}

export const firebaseApp = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    : { apiKey: 'placeholder', projectId: 'placeholder', authDomain: 'placeholder.firebaseapp.com', appId: 'placeholder' },
);

// Persisted to AsyncStorage so the Firebase session (and its refresh token)
// survives app restarts — the user stays signed in until they explicitly hit
// Logout, rather than needing a fresh OTP every time. This is in addition
// to, not instead of, the app's own Zustand `authStore` (see
// src/store/authStore.ts), which remains the source of truth for routing
// (splash screen, tab guards) since it also carries the Supabase user row.
export const firebaseAuth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});
