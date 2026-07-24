import { getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId,
  // Derived rather than a separate env var — every Firebase project's auth
  // domain is <projectId>.firebaseapp.com unless you've set up a custom domain.
  authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[firebase] NEXT_PUBLIC_FIREBASE_API_KEY / _PROJECT_ID / _APP_ID are not set. ' +
      'Google Sign-In will not work until .env.local is filled in and the dev server is restarted.',
  );
}

export const firebaseApp =
  getApps()[0] ??
  initializeApp(
    isFirebaseConfigured
      ? firebaseConfig
      : {
          apiKey: 'placeholder',
          projectId: 'placeholder',
          authDomain: 'placeholder.firebaseapp.com',
          appId: 'placeholder',
        },
  );

export const firebaseAuth = getAuth(firebaseApp);

// Persisted to the browser's localStorage so the Firebase session survives
// reloads — the user stays signed in until they explicitly log out. This is
// in addition to, not instead of, the app's own Zustand `authStore` (see
// src/store/authStore.ts), which remains the source of truth for routing
// since it also carries the Supabase user row.
if (typeof window !== 'undefined') {
  void setPersistence(firebaseAuth, browserLocalPersistence);
}
