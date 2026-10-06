import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { PageShell, Screen } from '@/components';
import { ORGANIZATION } from '@/lib/organization';

export const metadata: Metadata = {
  title: 'About',
  description:
    'NEDHub is an independent, student-built platform for NED University students — teacher reviews, past papers, FAQ, and more.',
};

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-foreground dark:text-foreground-dark">
        {heading}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-muted dark:text-muted-dark">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <Screen>
      <PageShell className="max-w-3xl py-12">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          About NEDHub
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted dark:text-muted-dark">
          NEDHub is a free, independent platform built for NED University students — starting
          with the {ORGANIZATION.name} community — to make a few everyday parts of university
          life easier: finding honest teacher reviews, sharing past papers and notes, and
          getting quick answers to common questions.
        </p>

        <div className="mt-8 space-y-8">
          <Section heading="What's on NEDHub">
            <p>
              <strong className="text-foreground dark:text-foreground-dark">
                Teacher Reviews
              </strong>{' '}
              — ratings and written reviews from students who&apos;ve actually taken a course,
              so you know what to expect before you register.
            </p>
            <p>
              <strong className="text-foreground dark:text-foreground-dark">
                Past Papers &amp; Notes
              </strong>{' '}
              — a shared library of exam papers and notes, organized by subject, uploaded by
              students for other students.
            </p>
            <p>
              <strong className="text-foreground dark:text-foreground-dark">
                FAQ &amp; Q&amp;A
              </strong>{' '}
              — straight answers about admissions, exams, fees, and the questions every new
              student has, plus a space to ask the ones that aren&apos;t already covered.
            </p>
          </Section>

          <Section heading="Who's behind it">
            <p>{ORGANIZATION.disclaimer}</p>
            <p>
              It&apos;s run as a side project, not a company — built and maintained by a student,
              for students. Decisions about what to build next are made the same way: based on
              what&apos;s actually useful, not what grows a metric.
            </p>
          </Section>

          <Section heading="Questions or feedback">
            <p>
              Found a bug, have a suggestion, or need something removed? See the{' '}
              <Link href="/contact" className="font-medium text-accent underline">
                Contact
              </Link>{' '}
              page.
            </p>
          </Section>
        </div>
      </PageShell>
    </Screen>
  );
}
