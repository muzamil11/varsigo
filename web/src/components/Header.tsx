'use client';

import { GraduationCap, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { ThemeToggle } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { signOutGoogle } from '@/features/auth/google';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/teachers', label: 'Teachers' },
  { href: '/papers', label: 'Papers' },
  { href: '/faq', label: 'FAQ' },
  { href: '/questions', label: 'Q&A' },
];

export function Header() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await signOutGoogle();
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur dark:border-line-dark dark:bg-background-dark/95">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <GraduationCap size={18} color="#FFFFFF" />
          </span>
          <span className="hidden text-lg font-bold text-foreground min-[380px]:inline dark:text-foreground-dark">
            Varsigo
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap px-1">
          {NAV_LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {hasHydrated && isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname.startsWith('/admin')
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark'
              }`}
            >
              <Shield size={14} />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {!hasHydrated ? null : isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-foreground dark:border-line-dark dark:text-foreground-dark"
              title={user?.email}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{user?.name ?? 'Log out'}</span>
            </button>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white sm:px-4"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
