'use client';

import { AlertTriangle, ArrowLeft, Folder as FolderIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, PageShell, Screen, StateMessage } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { fetchFolderLinks } from '@/features/links/api';
import type { ImportantLink } from '@/features/links/data';
import { LinksGrid } from '@/features/links/LinksGrid';
import { fetchPaperFolders, fetchPapers } from '@/features/papers/api';
import type { Paper, PaperFolder } from '@/features/papers/data';
import { PaperListSection } from '@/features/papers/PaperListSection';

/** A single subject's papers — reached by tapping a folder card on the main
 *  Papers page. Reuses the exact same search/filter/preview UI as the main
 *  listing (PaperListSection), just handed a folder-scoped set of papers. */
export default function PaperFolderPage() {
  const params = useParams<{ id: string }>();
  const folderId = params.id;

  const [folder, setFolder] = useState<PaperFolder | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    setLoading(true);
    setError(null);
    Promise.all([
      fetchPaperFolders(),
      fetchPapers({ folderId }),
      fetchDepartments(),
      fetchFolderLinks(folderId),
    ])
      .then(([folders, folderPapers, departmentList, folderLinks]) => {
        if (cancelled) return;
        setFolder(folders.find((f) => f.id === folderId) ?? null);
        setPapers(folderPapers);
        setDepartments(departmentList);
        setLinks(folderLinks);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

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

        {loading ? (
          <CardSkeletonList padded={false} />
        ) : error ? (
          <StateMessage icon={AlertTriangle} title="Couldn't load this subject" subtitle={error} />
        ) : !folder ? (
          <StateMessage
            icon={FolderIcon}
            title="Subject not found"
            subtitle="It may have been renamed or removed."
          />
        ) : (
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
        )}
      </PageShell>
    </Screen>
  );
}
