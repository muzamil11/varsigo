'use client';

import { GraduationCap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

import { Button, Screen } from '@/components';
import { upsertUserByGoogle } from '@/features/auth/api';
import { completeGoogleRedirectSignIn, signInWithGoogle } from '@/features/auth/google';
import { getPostAuthRoute, withRedirect } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  // Starts true: on mobile we might be landing back here right after a
  // signInWithRedirect() round trip to Google, and shouldn't flash the
  // plain "Continue with Google" button before that's checked.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const finishSignIn = async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser.email) {
      throw new Error('Your Google account has no email attached. Please try a different account.');
    }

    const supabaseUser = await upsertUserByGoogle({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
    });
    useAuthStore.getState().setUser(firebaseUser.uid, supabaseUser);
    const nextRoute = getPostAuthRoute(supabaseUser, usePrivacyStore.getState().accepted, redirectTo);
    // Deliberately not resetting `loading` here — the button should stay
    // in its spinner state through the navigation below rather than
    // flashing back to normal for the moment before the next page (and,
    // in dev, its on-demand Turbopack compile) actually appears. Without
    // this, the page can look like it silently hung.
    const isIntermediateStep = nextRoute === '/onboarding-name' || nextRoute === '/privacy-notice';
    router.replace(isIntermediateStep ? withRedirect(nextRoute, redirectTo) : nextRoute);
  };

  // Picks up the result of a mobile signInWithGoogle() redirect — a no-op
  // (resolves null) on a normal, non-redirect page load.
  useEffect(() => {
    let cancelled = false;
    completeGoogleRedirectSignIn()
      .then(async (firebaseUser) => {
        if (cancelled) return;
        if (firebaseUser) {
          await finishSignIn(firebaseUser);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Please try again.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const firebaseUser = await signInWithGoogle();
      // null means signInWithGoogle() kicked off a mobile redirect instead
      // — the browser is already navigating to Google, nothing more to do.
      if (firebaseUser) {
        await finishSignIn(firebaseUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
      setLoading(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="mb-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <GraduationCap size={28} color="#FFFFFF" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            Welcome to NEDHub
          </h1>
          <p className="mt-2 text-base text-muted dark:text-muted-dark">
            Sign in with Google to continue
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
            {error}
          </p>
        )}

        <Button label="Continue with Google" onPress={handleGoogleSignIn} loading={loading} />
      </div>
    </Screen>
  );
}
