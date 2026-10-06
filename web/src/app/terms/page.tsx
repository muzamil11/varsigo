import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { PageShell, Screen } from '@/components';
import { CONTACT_EMAIL } from '@/lib/contact';
import { ORGANIZATION } from '@/lib/organization';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms that apply to using NEDHub.',
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

export default function TermsPage() {
  return (
    <Screen>
      <PageShell className="max-w-3xl py-12">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          Terms of Use
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-muted-dark">Last updated October 2026</p>

        <div className="mt-8 space-y-8">
          <Section heading="1. What NEDHub is">
            <p>
              NEDHub is an independent, student-run platform — {ORGANIZATION.disclaimer} It is
              not affiliated with, endorsed by, or operated by NED University. Content on it
              (reviews, ratings, papers, notes, questions and answers) is submitted by students
              and reflects their own opinions and experience, not the university&apos;s or
              NEDHub&apos;s.
            </p>
          </Section>

          <Section heading="2. Accounts">
            <p>
              You sign in with Google. By signing in, you agree to these terms. You&apos;re
              responsible for anything posted under your account.
            </p>
          </Section>

          <Section heading="3. Content you submit">
            <p>
              Reviews, ratings, uploaded papers/notes, links, and questions you post stay yours,
              but by posting them you let NEDHub display, store, and share them with other NED
              students through the platform. You&apos;re responsible for what you submit —
              don&apos;t post:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Harassing, defamatory, or deliberately false content about any person</li>
              <li>Copyrighted material you don&apos;t have the right to share</li>
              <li>Anyone else&apos;s personal/private information</li>
              <li>Spam, malware, or anything illegal</li>
            </ul>
            <p>
              Uploaded papers and notes are meant to be shared study resources for NED students —
              upload your own notes or materials you have the right to redistribute.
            </p>
          </Section>

          <Section heading="4. Moderation">
            <p>
              Reviews and uploads go through approval before appearing publicly. Any review can
              be reported directly from its page; reported or rule-breaking content may be
              removed without notice. If content about you needs to come down and reporting
              doesn&apos;t resolve it, see{' '}
              <Link href="/contact" className="font-medium text-accent underline">
                Contact
              </Link>
              .
            </p>
          </Section>

          <Section heading="5. No warranty">
            <p>
              NEDHub is provided &quot;as is,&quot; run as a side project with no guarantee of
              uptime, accuracy, or availability. Teacher reviews are student opinions, not
              verified facts — use your own judgment. Papers and notes are shared as-is and
              aren&apos;t guaranteed to be accurate or up to date.
            </p>
          </Section>

          <Section heading="6. Limitation of liability">
            <p>
              To the fullest extent permitted by law, NEDHub and its maintainer aren&apos;t
              liable for any damages arising from your use of the platform or reliance on content
              posted on it.
            </p>
          </Section>

          <Section heading="7. Changes">
            <p>
              These terms may change as NEDHub grows. Continued use after a change means you
              accept the updated terms.
            </p>
          </Section>

          <Section heading="8. Contact">
            <p>
              Questions about these terms:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </PageShell>
    </Screen>
  );
}
