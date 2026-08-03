'use client';

import {
  AlertTriangle,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LogIn,
  Search as SearchIcon,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { AnimatedListItem, Chip, PageShell, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { useAuthStore } from '@/store/authStore';
import { fetchPapers } from './api';
import { PAPER_KIND_LABELS, getPaperFileType, type Paper } from './data';

interface PaperBrowserProps {
  papers: Paper[];
  departments: Department[];
  error?: string | null;
}

export function PaperBrowser({ papers: initialPapers, departments, error }: PaperBrowserProps) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [papers, setPapers] = useState(initialPapers);
  const [refreshState, setRefreshState] = useState<'idle' | 'loading' | 'settled'>('idle');
  const [clientError, setClientError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [kind, setKind] = useState<'All' | 'past_paper' | 'notes'>('All');
  const loginHref = '/login?redirect=/papers';
  const uploadHref = '/papers/upload';
  const isFiltered = Boolean(search.trim() || departmentId || kind !== 'All');
  const visibleError = clientError ?? error;
  const showInitialLoading =
    hasHydrated && isAuthenticated && refreshState !== 'settled' && papers.length === 0;
  const refreshingPapers =
    hasHydrated && isAuthenticated && refreshState === 'loading' && papers.length > 0;

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) => {
      if (kind !== 'All' && p.kind !== kind) return false;
      if (departmentId) {
        const dept = departments.find((d) => d.id === departmentId);
        if (dept && p.department !== dept.name) return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        (p.department ?? '').toLowerCase().includes(q)
      );
    });
  }, [papers, search, departmentId, kind, departments]);

  const heroCopy = isAuthenticated
    ? 'Browse approved papers, download files, or upload useful study resources for other NED students.'
    : 'Sign in with Google to browse approved papers, download files, or upload useful study resources for other NED students.';

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

            {hasHydrated && isAuthenticated && (
              <div className="flex flex-wrap items-center gap-3">
                {refreshingPapers && (
                  <span className="text-xs font-medium text-muted dark:text-muted-dark">
                    Refreshing in background
                  </span>
                )}
                <Link
                  href={uploadHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-lg shadow-accent/20"
                >
                  <UploadCloud size={17} />
                  Upload paper
                </Link>
              </div>
            )}
          </div>
        </div>

        {hasHydrated && !isAuthenticated && (
          <div className="m-5 rounded-2xl border border-line bg-background p-8 text-center dark:border-line-dark dark:bg-background-dark">
            <LogIn className="mx-auto text-muted dark:text-muted-dark" size={30} />
            <p className="mt-3 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Sign in to view papers
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted dark:text-muted-dark">
              Past papers and notes are available to signed-in students so uploads, downloads, and
              moderation stay tied to real accounts.
            </p>
            <Link
              href={loginHref}
              className="mt-5 inline-flex rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white"
            >
              Continue with Google
            </Link>
          </div>
        )}

        {hasHydrated && !isAuthenticated ? null : (
          <div className="p-5 sm:p-7 lg:p-9">
            <div className="rounded-2xl border border-line bg-background p-4 dark:border-line-dark dark:bg-background-dark">
              <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_260px]">
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search papers, subjects..."
                />
                <label className="sr-only" htmlFor="paper-department">
                  Department
                </label>
                <select
                  id="paper-department"
                  value={departmentId ?? ''}
                  onChange={(event) => setDepartmentId(event.target.value || null)}
                  className="h-12 rounded-full border border-line bg-card px-4 text-sm text-foreground outline-none focus:border-accent dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap">
                <Chip label="All types" selected={kind === 'All'} onPress={() => setKind('All')} />
                <Chip
                  label="Past Papers"
                  selected={kind === 'past_paper'}
                  onPress={() => setKind('past_paper')}
                />
                <Chip label="Notes" selected={kind === 'notes'} onPress={() => setKind('notes')} />
              </div>
            </div>

            <div className="mt-6">
              {showInitialLoading ? (
                <div className="rounded-2xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
                  <StateMessage
                    icon={SearchIcon}
                    title="Loading approved papers"
                    subtitle="Checking the latest approved uploads."
                  />
                </div>
              ) : visibleError ? (
                <StateMessage icon={AlertTriangle} title="Couldn't load papers" subtitle={visibleError} />
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
                  <StateMessage
                    icon={SearchIcon}
                    title={papers.length === 0 ? 'No approved papers yet' : 'No matching papers'}
                    subtitle={
                      papers.length === 0
                        ? 'Uploaded papers appear here after admin approval.'
                        : isFiltered
                          ? 'Try a different search or filter.'
                          : 'Approved papers will show here.'
                    }
                  />
                  {hasHydrated && (
                    <Link
                      href={uploadHref}
                      className="mt-5 inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Upload the first paper
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((paper, index) => {
                    const fileType = getPaperFileType(paper.fileUrl);
                    return (
                      <AnimatedListItem key={paper.id} index={index}>
                        <article className="grid gap-4 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark lg:grid-cols-[140px_minmax(0,1fr)_220px] lg:items-center">
                          <div className="flex h-32 items-center justify-center rounded-xl border border-line bg-background dark:border-line-dark dark:bg-background-dark lg:h-28">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                              {fileType === 'pdf' ? (
                                <FileText size={26} className="text-accent" />
                              ) : (
                                <ImageIcon size={26} className="text-accent" />
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                                {PAPER_KIND_LABELS[paper.kind]}
                              </span>
                              {paper.year && (
                                <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark">
                                  {paper.year}
                                </span>
                              )}
                            </div>
                            <h2 className="text-lg font-bold text-foreground dark:text-foreground-dark">
                              {paper.title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted dark:text-muted-dark">
                              {paper.subject}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted dark:text-muted-dark">
                              <span className="inline-flex items-center gap-2">
                                <FileText size={14} className="text-accent" />
                                {paper.department ?? 'General'}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays size={14} className="text-accent" />
                                Uploaded by {paper.uploaderName} on {paper.createdAt}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                            <a
                              href={paper.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
                            >
                              <ExternalLink size={15} />
                              View
                            </a>
                            <a
                              href={paper.fileUrl}
                              download
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white"
                            >
                              <Download size={15} />
                              Download
                            </a>
                          </div>
                        </article>
                      </AnimatedListItem>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
