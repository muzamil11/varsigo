import { FileText, HelpCircle, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Screen } from '@/components';

export const revalidate = 300;

const PILLARS = [
  {
    href: '/teachers',
    icon: Star,
    title: 'Teacher Reviews',
    description: 'Real ratings on teaching, grading, and attendance from NED students.',
  },
  {
    href: '/papers',
    icon: FileText,
    title: 'Past Papers & Notes',
    description: 'Browse and download past papers and notes shared by other students.',
  },
  {
    href: '/faq',
    icon: HelpCircle,
    title: 'University FAQ',
    description: 'Answers to common questions about admissions, CGPA, fees, and more.',
  },
  {
    href: '/questions',
    icon: MessageCircle,
    title: 'Student Q&A',
    description: 'Ask questions and get answers from other NED students.',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Sign in with Google',
    description: 'One tap with your Google account - no separate password to remember.',
  },
  {
    step: '2',
    title: 'Browse or contribute',
    description: 'Browse public pages freely. Sign in to read or write reviews and upload papers.',
  },
  {
    step: '3',
    title: "Moderated before it's public",
    description: 'Every review and upload is checked before it goes live, keeping things useful.',
  },
];

export default function HomePage() {
  return (
    <Screen>
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/20 blur-3xl dark:bg-accent/10"
        />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark sm:text-5xl">
              Everything NED students need, in one place
            </h1>
            <p className="mt-4 text-lg text-muted dark:text-muted-dark">
              Honest teacher reviews, past papers &amp; notes, and answers to the questions every
              NED student has.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/teachers"
                className="rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white"
              >
                Browse Teachers
              </Link>
              <Link
                href="/papers"
                className="rounded-xl border border-line px-6 py-3 text-base font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
              >
                Find Past Papers
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className="rounded-2xl border border-line bg-card p-5 transition-transform duration-150 hover:-translate-y-0.5 dark:border-line-dark dark:bg-card-dark"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <pillar.icon size={20} className="text-accent" />
                </div>
                <h2 className="text-base font-semibold text-foreground dark:text-foreground-dark">
                  {pillar.title}
                </h2>
                <p className="mt-1 text-sm text-muted dark:text-muted-dark">{pillar.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-24">
            <h2 className="text-center text-2xl font-bold text-foreground dark:text-foreground-dark">
              How it works
            </h2>
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted dark:text-muted-dark">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
