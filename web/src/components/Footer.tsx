import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { APP_CONTAINER_CLASS } from './Layout';

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
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <GraduationCap size={16} color="#FFFFFF" />
          </span>
          <span className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            Varsigo
          </span>
          <span className="text-sm text-muted dark:text-muted-dark">
            — an independent, student-run platform for NED University.
          </span>
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
      <p className="border-t border-line px-4 py-4 text-center text-xs text-muted dark:border-line-dark dark:text-muted-dark">
        © {new Date().getFullYear()} Varsigo. Not officially affiliated with NED University.
      </p>
    </footer>
  );
}
