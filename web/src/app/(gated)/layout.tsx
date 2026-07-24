'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Screen, StateMessage } from '@/components';
import { useAuthStore } from '@/store/authStore';

/** Shared client-side auth gate for every page that requires a signed-in
 *  user (reviews, uploads, Q&A, post-login onboarding). There's no
 *  cookie-based session to check in Next.js middleware — auth state lives
 *  in a Zustand store hydrated from localStorage — so the gate runs here,
 *  matching the mobile app's own client-side-only auth model. */
export default function GatedLayout({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Screen>
        <StateMessage icon={LogIn} title="Sign in to continue" subtitle="This section is only available to signed-in students." />
        <div className="flex justify-center pb-12">
          <Link href="/login" className="rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white">
            Sign in with Google
          </Link>
        </div>
      </Screen>
    );
  }

  return <>{children}</>;
}
