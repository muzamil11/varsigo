import { Mail } from 'lucide-react';
import type { Metadata } from 'next';
import React from 'react';

import { PageShell, Screen } from '@/components';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the NEDHub team — bug reports, feedback, and removal requests.',
};

export default function ContactPage() {
  return (
    <Screen>
      <PageShell className="max-w-3xl py-12">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">Contact</h1>
        <p className="mt-4 text-sm leading-7 text-muted dark:text-muted-dark">
          NEDHub is run by a single student as a side project, so there&apos;s no support team —
          just one inbox. That said, real issues get read and acted on.
        </p>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-line bg-card px-5 py-4 transition-colors hover:border-accent/40 dark:border-line-dark dark:bg-card-dark"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Mail size={20} className="text-accent" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground dark:text-foreground-dark">
              {CONTACT_EMAIL}
            </span>
            <span className="block text-xs text-muted dark:text-muted-dark">
              Tap to open in your email app
            </span>
          </span>
        </a>

        <div className="mt-8 space-y-3 text-sm leading-7 text-muted dark:text-muted-dark">
          <p>Reach out for things like:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>A bug or something broken on the site or app</li>
            <li>
              A review or upload you want removed — including if you&apos;re a teacher and a
              review is about you
            </li>
            <li>Requesting that your account data be deleted</li>
            <li>Feedback, suggestions, or anything else about NEDHub</li>
          </ul>
          <p>This is a side project, so replies aren&apos;t instant — but every email is read.</p>
        </div>
      </PageShell>
    </Screen>
  );
}
