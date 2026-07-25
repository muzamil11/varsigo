'use client';

import { GraduationCap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { Button, Screen } from '@/components';
import { upsertUserByGoogle } from '@/features/auth/api';
import { signInWithGoogle } from '@/features/auth/google';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const firebaseUser = await signInWithGoogle();
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
            Welcome to Varsigo
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
