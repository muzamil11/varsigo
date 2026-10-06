import type { Metadata } from 'next';
import React from 'react';

import { PageShell, Screen } from '@/components';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What data NEDHub collects, why, and how it is used.',
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

export default function PrivacyPolicyPage() {
  return (
    <Screen>
      <PageShell className="max-w-3xl py-12">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-muted-dark">Last updated October 2026</p>

        <div className="mt-8 space-y-8">
          <Section heading="1. Information we collect">
            <p>
              When you sign in with Google, we receive your name and email from Google/Firebase
              and store them against your account (keyed by your Firebase user ID) so your
              reviews, uploads, and questions can be tied to your account. We also store whatever
              content you choose to submit — reviews, ratings, uploaded files, links, and
              questions.
            </p>
            <p>
              Browsing NEDHub without signing in — Papers, FAQ, and these info pages — doesn&apos;t
              require or collect any account information.
            </p>
          </Section>

          <Section heading="2. Anonymous analytics">
            <p>
              We use PostHog to understand how many people use NEDHub and which pages are
              useful — nothing more. This tracking is anonymous by design: no name, email, or
              account data is ever sent to it, no profile is built for you, autocapture and
              session recording are both off, and we never link an analytics event back to a
              signed-in identity. It only runs on the live site, never during development.
            </p>
          </Section>

          <Section heading="3. Third-party services we use">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground dark:text-foreground-dark">
                  Google Sign-In / Firebase Authentication
                </strong>{' '}
                — handles sign-in and verifies your identity.
              </li>
              <li>
                <strong className="text-foreground dark:text-foreground-dark">Supabase</strong> —
                stores app data (your account row, reviews, uploads, questions) and hosts
                uploaded files.
              </li>
              <li>
                <strong className="text-foreground dark:text-foreground-dark">PostHog</strong> —
                anonymous product analytics, as described above.
              </li>
            </ul>
            <p>Each has its own privacy policy governing how they handle data on their end.</p>
          </Section>

          <Section heading="4. How we use your information">
            <p>
              To run the core features — showing your reviews/uploads to other students, letting
              you manage what you&apos;ve posted, and (if you&apos;re flagged as an admin)
              moderating content. We don&apos;t sell your data, and we don&apos;t use it for
              advertising.
            </p>
          </Section>

          <Section heading="5. Your data, your control">
            <p>
              Reviews can be posted anonymously. To request that your account or submitted
              content be deleted, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section heading="6. Children's privacy">
            <p>
              NEDHub is built for university students and isn&apos;t directed at children under
              13.
            </p>
          </Section>

          <Section heading="7. Changes to this policy">
            <p>
              This policy may be updated as NEDHub changes. Material changes will be reflected
              here with an updated date.
            </p>
          </Section>

          <Section heading="8. Contact">
            <p>
              Questions about this policy:{' '}
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
