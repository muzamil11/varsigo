import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { ORGANIZATION } from '@/lib/organization';
import { APP_CONTAINER_CLASS } from './Layout';
import { OrgBadge } from './OrgBadge';

const LINKS = [
  { href: '/teachers', label: 'Teachers' },
  { href: '/papers', label: 'Papers' },
  { href: '/faq', label: 'FAQ' },
  { href: '/questions', label: 'Q&A' },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line dark:border-line-dark">
      <div className={`${APP_CONTAINER_CLASS} flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <GraduationCap size={16} color="#FFFFFF" />
            </span>
            <span className="text-sm font-semibold text-foreground dark:text-foreground-dark">
              NEDHub
            </span>
          </div>
          <span className="h-3.5 w-px bg-line dark:bg-line-dark" />
          <OrgBadge variant="compact" />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-line px-4 py-4 text-center dark:border-line-dark">
        <p className="text-xs text-muted dark:text-muted-dark">
          © {new Date().getFullYear()} NEDHub — {ORGANIZATION.disclaimer}
        </p>
        <p className="mt-1 text-xs text-muted dark:text-muted-dark">
          We use anonymous analytics to understand how NEDHub is used — no names, emails, or
          account data are ever sent.
        </p>
      </div>
    </footer>
  );
}
