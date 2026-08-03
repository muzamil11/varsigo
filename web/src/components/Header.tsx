'use client';

import { GraduationCap, LogOut, Menu, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await signOutGoogle();
    logout();
    setMenuOpen(false);
  };

  const authControl = !hasHydrated ? null : isAuthenticated ? (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-foreground dark:border-line-dark dark:text-foreground-dark"
      title={user?.email}
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">{user?.name ?? 'Log out'}</span>
      <span className="sm:hidden">Log out</span>
    </button>
  ) : (
    <Link
      href={`/login?redirect=${encodeURIComponent(pathname)}`}
      className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white sm:px-4"
    >
      Sign in
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur dark:border-line-dark dark:bg-background-dark/95">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <GraduationCap size={18} color="#FFFFFF" />
          </span>
          <span className="text-lg font-bold text-foreground dark:text-foreground-dark">
            Varsigo
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
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

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">{authControl}</div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-foreground md:hidden dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-line bg-background px-4 py-3 shadow-lg md:hidden dark:border-line-dark dark:bg-background-dark">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
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
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname.startsWith('/admin')
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark'
                }`}
              >
                <Shield size={14} />
                Admin
              </Link>
            )}
            <div className="mt-2 border-t border-line pt-3 sm:hidden dark:border-line-dark">
              {authControl}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
