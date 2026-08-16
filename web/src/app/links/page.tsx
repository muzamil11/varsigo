import type { Metadata } from 'next';
import React from 'react';

import { PageShell, Screen } from '@/components';
import { fetchImportantLinks } from '@/features/links/api';
import { LinksGrid } from '@/features/links/LinksGrid';
import { SuggestLinkForm } from '@/features/links/SuggestLinkForm';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Important Links',
  description: 'Useful external resources shared by NEDHub for NED University students.',
};

export default async function LinksPage() {
  // Best-effort — a Supabase outage shouldn't fail this page's static
  // generation, same reasoning as page.tsx and teachers/page.tsx.
  let links: Awaited<ReturnType<typeof fetchImportantLinks>> = [];
  try {
    links = await fetchImportantLinks();
  } catch {
    links = [];
  }

  return (
    <Screen>
      <PageShell className="py-10">
        <h1 className="mb-1 text-3xl font-bold text-foreground dark:text-foreground-dark">
          Important Links
        </h1>
        <p className="mb-5 text-sm text-muted dark:text-muted-dark">
          Useful external resources shared by NEDHub.
        </p>
        <div className="mb-8">
          <SuggestLinkForm />
        </div>
        <LinksGrid links={links} />
      </PageShell>
    </Screen>
  );
}
