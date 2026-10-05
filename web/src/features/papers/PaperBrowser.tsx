'use client';

import { AlertTriangle, CalendarDays, ChevronRight, FileText, Folder, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { PageShell, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { useSearchTracking } from '@/lib/useSearchTracking';
import { useAuthStore } from '@/store/authStore';
import { fetchPapers } from './api';
import type { Paper, PaperFolder } from './data';
import { PaperListSection } from './PaperListSection';

interface PaperBrowserProps {
  papers: Paper[];
  departments: Department[];
  folders: PaperFolder[];
  error?: string | null;
}

/** One folder in the "browse by subject" list, styled like the paper cards
 *  below it (same icon-box + title + meta-row shape) so folders and papers
 *  read as one visual system, just linking to that folder's own page
 *  instead of a view/download action. */
function FolderCard({
  href,
  name,
  count,
  department,
  latestDate,
}: {
  href: string;
  name: string;
  count: number;
  department: string | null;
  latestDate: string | null;
}) {
  return (
    <Link
      href={href}
      className="grid gap-4 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-accent/40 dark:border-line-dark dark:bg-card-dark lg:grid-cols-[140px_minmax(0,1fr)_44px] lg:items-center"
    >
      <div className="flex h-32 items-center justify-center rounded-xl border border-line bg-background dark:border-line-dark dark:bg-background-dark lg:h-28">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Folder size={26} className="text-accent" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            {count} {count === 1 ? 'paper' : 'papers'}
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground dark:text-foreground-dark">{name}</h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted dark:text-muted-dark">
          <span className="inline-flex items-center gap-2">
            <FileText size={14} className="text-accent" />
            {department ?? 'General'}
          </span>
          {latestDate && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} className="text-accent" />
              Latest: {latestDate}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={20} className="hidden shrink-0 text-muted dark:text-muted-dark lg:block" />
    </Link>
  );
}

export function PaperBrowser({ papers: initialPapers, departments, folders, error }: PaperBrowserProps) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [papers, setPapers] = useState(initialPapers);
  const [refreshState, setRefreshState] = useState<'idle' | 'loading' | 'settled'>('idle');
  const [clientError, setClientError] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState('');
  useSearchTracking('paper_subjects', folderSearch);
  const loginHref = '/login?redirect=/papers';
  const uploadHref = '/papers/upload';
  const visibleError = clientError ?? error;
  // The papers array always starts from the server-rendered `initialPapers`
  // (never undefined), so there's always something real to show — including
  // an accurate empty state. Never swap that out for a loading placeholder
  // during the background refetch below, or the empty state flickers
  // (empty -> "Loading approved papers" -> empty) right after hydration.
  const refreshingPapers = hasHydrated && isAuthenticated && refreshState === 'loading';

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setRefreshState((current) =>
          papers.length > 0 && current === 'settled' ? 'settled' : 'loading',
        );
        setClientError(null);
      }
    });
    fetchPapers()
      .then((freshPapers) => {
        if (!cancelled) setPapers(freshPapers);
      })
      .catch((err) => {
        if (!cancelled) {
          setClientError(err instanceof Error ? err.message : 'Failed to load papers.');
        }
      })
      .finally(() => {
        if (!cancelled) setRefreshState('settled');
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, papers.length]);

  /** Per-folder count/department/latest-date, plus the uncategorized bucket
   *  that shows directly in the main listing below instead of behind a
   *  folder click. `papers` is already sorted newest-first by the API, so
   *  each folder's first match is its most recent paper — no separate sort
   *  needed. Department is taken from that same first paper: folders are
   *  subject-specific in practice, so its papers share one department. */
  const { folderMeta, uncategorizedPapers } = useMemo(() => {
    const meta = new Map<string, { count: number; department: string | null; latestDate: string }>();
    const uncategorized: Paper[] = [];
    for (const p of papers) {
      if (!p.folderId) {
        uncategorized.push(p);
        continue;
      }
      const existing = meta.get(p.folderId);
      if (existing) existing.count += 1;
      else meta.set(p.folderId, { count: 1, department: p.department, latestDate: p.createdAt });
    }
    return { folderMeta: meta, uncategorizedPapers: uncategorized };
  }, [papers]);

  const visibleFolders = useMemo(() => {
    const q = folderSearch.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, folderSearch]);

  const heroCopy = isAuthenticated
    ? 'Browse approved papers, download files, or upload useful study resources for other NED students.'
    : 'Browse approved papers and download files — sign in with Google to upload your own.';

  return (
    <PageShell>
      <section className="overflow-hidden rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line bg-accent/10 px-5 py-7 dark:border-line-dark sm:px-7 lg:px-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-background px-3 py-1.5 text-xs font-semibold text-accent dark:bg-background-dark">
                <FileText size={14} />
                NED resource library
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
                Past Papers &amp; Notes
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted dark:text-muted-dark sm:text-base">
                {heroCopy}
              </p>
            </div>

            {hasHydrated && (
              <div className="flex flex-wrap items-center gap-3">
                {refreshingPapers && (
                  <span className="text-xs font-medium text-muted dark:text-muted-dark">
                    Refreshing in background
                  </span>
                )}
                <Link
                  href={isAuthenticated ? uploadHref : loginHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-lg shadow-accent/20"
                >
                  <UploadCloud size={17} />
                  {isAuthenticated ? 'Upload paper' : 'Sign in to upload'}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-9">
            {visibleError && (
              <div className="mb-8">
                <StateMessage icon={AlertTriangle} title="Couldn't load papers" subtitle={visibleError} />
              </div>
            )}
            {!visibleError && folders.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                    Browse by subject
                  </p>
                  {folders.length > 6 && (
                    <div className="w-full sm:w-64">
                      <SearchBar
                        value={folderSearch}
                        onChangeText={setFolderSearch}
                        placeholder="Search subjects..."
                      />
                    </div>
                  )}
                </div>
                {visibleFolders.length === 0 ? (
                  <p className="rounded-2xl border border-line bg-card p-6 text-center text-sm text-muted dark:border-line-dark dark:bg-card-dark dark:text-muted-dark">
                    No subjects match &quot;{folderSearch.trim()}&quot;.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {visibleFolders.map((folder) => {
                      const meta = folderMeta.get(folder.id);
                      return (
                        <FolderCard
                          key={folder.id}
                          href={`/papers/folder/${folder.id}`}
                          name={folder.name}
                          count={meta?.count ?? 0}
                          department={meta?.department ?? null}
                          latestDate={meta?.latestDate ?? null}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!visibleError && (
              <>
                <p className="mb-3 text-sm font-semibold text-foreground dark:text-foreground-dark">
                  {folders.length > 0 ? 'Uncategorized papers' : 'All papers'}
                </p>
                <PaperListSection
                  papers={uncategorizedPapers}
                  departments={departments}
                  showFolderBadge={false}
                  emptyTitle={
                    folders.length > 0 && uncategorizedPapers.length === 0
                      ? 'Nothing uncategorized'
                      : 'No approved papers yet'
                  }
                  emptySubtitle={
                    folders.length > 0 && uncategorizedPapers.length === 0
                      ? 'Every approved paper is already sorted into a subject above.'
                      : 'Uploaded papers appear here after admin approval.'
                  }
                  uploadHref={uploadHref}
                />
              </>
            )}
          </div>
      </section>
    </PageShell>
  );
}
