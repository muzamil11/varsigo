import type { Metadata } from 'next';
import React from 'react';

import { Screen } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import { PaperBrowser } from '@/features/papers/PaperBrowser';
import { fetchPapers, fetchPaperFolders } from '@/features/papers/api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Past Papers & Notes',
  description: 'Browse and download NED University past papers and notes shared by students, organized by department and subject.',
};

export default async function PapersPage() {
  // See teachers/page.tsx's comment — caught here so an outage or missing
  // env vars at build time doesn't fail this page's static generation.
  let papers: Awaited<ReturnType<typeof fetchPapers>> = [];
  let departments: Awaited<ReturnType<typeof fetchDepartments>> = [];
  let folders: Awaited<ReturnType<typeof fetchPaperFolders>> = [];
  let error: string | null = null;
  try {
    [papers, departments, folders] = await Promise.all([
      fetchPapers(),
      fetchDepartments(),
      fetchPaperFolders(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load papers.';
  }

  return (
    <Screen>
      <PaperBrowser papers={papers} departments={departments} folders={folders} error={error} />
    </Screen>
  );
}
