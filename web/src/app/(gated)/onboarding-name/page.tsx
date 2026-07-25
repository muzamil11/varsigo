'use client';

import { User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { Button, Screen } from '@/components';
import { updateUserName } from '@/features/auth/api';
import { getPostAuthRoute, withRedirect } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';

export default function OnboardingNamePage() {
  return (
    <Suspense fallback={null}>
      <OnboardingNamePageContent />
    </Suspense>
  );
}

function OnboardingNamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || !user) return;

    setLoading(true);
    setError(null);
    try {
      const updated = await updateUserName(user.id, trimmed);
      useAuthStore.getState().updateUser(updated);
      const nextRoute = getPostAuthRoute(updated, usePrivacyStore.getState().accepted, redirectTo);
      // See login/page.tsx's comment — keep the spinner through the
      // navigation instead of resetting it first.
      router.replace(nextRoute === '/privacy-notice' ? withRedirect(nextRoute, redirectTo) : nextRoute);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try again.');
      setLoading(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="mb-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <User size={28} color="#FFFFFF" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            What&apos;s your name?
          </h1>
          <p className="mt-2 text-base text-muted dark:text-muted-dark">
            This is how you&apos;ll appear on reviews you post publicly.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
            {error}
          </p>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ali Khan"
          autoFocus
          className="mb-6 h-14 rounded-xl border border-line bg-card px-4 text-lg text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />

        <Button
          label="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={name.trim().length === 0}
        />
      </div>
    </Screen>
  );
}
