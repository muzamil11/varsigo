'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { CardSkeletonList, PageShell, Screen, StateMessage } from '@/components';
import { useAuthStore } from '@/store/authStore';

const SECTIONS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/uploads', label: 'Uploads' },
  { href: '/admin/lost-found', label: 'Lost & Found' },
  { href: '/admin/teachers', label: 'Departments' },
  { href: '/admin/teachers/courses', label: 'Courses' },
  { href: '/admin/teachers/list', label: 'Teachers' },
  { href: '/admin/community', label: 'Community' },
];

/** Admin gate is the same client-side email check the mobile app's Admin
 *  tab uses (see src/lib/admin.ts) — not a real security boundary, since
 *  there's no server verifying the Firebase ID token yet. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isAdmin = useAuthStore((s) => s.isAdmin());

  if (!hasHydrated) {
    return (
      <Screen>
        <PageShell className="py-6">
          <CardSkeletonList padded={false} />
        </PageShell>
      </Screen>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Screen>
        <StateMessage
          icon={ShieldAlert}
          title="Admin access only"
          subtitle="Sign in with the admin account to access this section."
        />
        {!isAuthenticated && (
          <div className="flex justify-center pb-12">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <PageShell className="py-6">
        <h1 className="mb-4 text-2xl font-bold text-foreground dark:text-foreground-dark">
          Admin
        </h1>
        <nav className="mb-6 flex flex-wrap gap-1 border-b border-line pb-3 dark:border-line-dark">
          {SECTIONS.map((section) => {
            const active = pathname === section.href;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </PageShell>
    </Screen>
  );
}
