import { AlertTriangle, ArrowLeft, Folder as FolderIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

import { PageShell, Screen, StateMessage } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import { fetchFolderLinks } from '@/features/links/api';
import { LinksGrid } from '@/features/links/LinksGrid';
import { fetchPaperFolders, fetchPapers } from '@/features/papers/api';
import { PaperListSection } from '@/features/papers/PaperListSection';

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const folders = await fetchPaperFolders();
    const folder = folders.find((f) => f.id === id);
    if (!folder) return { title: 'Subject' };
    return {
      title: `${folder.name} Past Papers & Notes`,
      description: `Browse and download ${folder.name} past papers and notes shared by NED students.`,
    };
  } catch {
    return { title: 'Subject' };
  }
}

/** A single subject's papers — reached by tapping a folder card on the main
 *  Papers page. Public and server-rendered, same as /papers itself, so
 *  search engines (and signed-out students) see the real paper list, not a
 *  loading skeleton — only uploading stays behind sign-in. */
export default async function PaperFolderPage({ params }: Props) {
  const { id } = await params;

  let folder: Awaited<ReturnType<typeof fetchPaperFolders>>[number] | null = null;
  let papers: Awaited<ReturnType<typeof fetchPapers>> = [];
  let departments: Awaited<ReturnType<typeof fetchDepartments>> = [];
  let links: Awaited<ReturnType<typeof fetchFolderLinks>> = [];
  let error: string | null = null;
  try {
    const [folders, folderPapers, departmentList, folderLinks] = await Promise.all([
      fetchPaperFolders(),
      fetchPapers({ folderId: id }),
      fetchDepartments(),
      fetchFolderLinks(id),
    ]);
    folder = folders.find((f) => f.id === id) ?? null;
    papers = folderPapers;
    departments = departmentList;
    links = folderLinks;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load.';
  }

  if (!error && !folder) notFound();

  return (
    <Screen>
      <PageShell className="py-6">
        <Link
          href="/papers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted dark:text-muted-dark"
        >
          <ArrowLeft size={14} />
          All subjects
        </Link>

        {error ? (
          <StateMessage icon={AlertTriangle} title="Couldn't load this subject" subtitle={error} />
        ) : (
          folder && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <FolderIcon size={22} className="text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                    {folder.name}
                  </h1>
                  <p className="text-sm text-muted dark:text-muted-dark">
                    {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
                  </p>
                </div>
              </div>
              {links.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 text-sm font-semibold text-foreground dark:text-foreground-dark">
                    Links
                  </p>
                  <LinksGrid links={links} />
                </div>
              )}
              <PaperListSection
                papers={papers}
                departments={departments}
                showFolderBadge={false}
                searchPlaceholder={`Search in ${folder.name}...`}
                emptyTitle="No papers yet"
                emptySubtitle="Papers assigned to this subject will show here."
              />
            </>
          )
        )}
      </PageShell>
    </Screen>
  );
}
