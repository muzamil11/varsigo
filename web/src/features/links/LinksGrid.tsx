'use client';

import { ExternalLink, Link2 } from 'lucide-react';
import React from 'react';

import { StateMessage } from '@/components';
import type { ImportantLink } from './data';

export function LinksGrid({ links }: { links: ImportantLink[] }) {
  if (links.length === 0) {
    return <StateMessage icon={Link2} title="No links yet" subtitle="Check back later." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5 transition-transform duration-150 hover:-translate-y-0.5 dark:border-line-dark dark:bg-card-dark"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Link2 size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                {link.title}
              </p>
              {link.subtitle && (
                <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">{link.subtitle}</p>
              )}
            </div>
          </div>
          <ExternalLink size={16} className="shrink-0 text-muted dark:text-muted-dark" />
        </a>
      ))}
    </div>
  );
}
