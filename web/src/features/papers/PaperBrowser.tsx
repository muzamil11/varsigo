'use client';

import {
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  LogIn,
  Search as SearchIcon,
} from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { AnimatedListItem, Card, Chip, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { useAuthStore } from '@/store/authStore';
import { PAPER_KIND_LABELS, getPaperFileType, type Paper } from './data';

interface PaperBrowserProps {
  papers: Paper[];
  departments: Department[];
  error?: string | null;
}

export function PaperBrowser({ papers, departments, error }: PaperBrowserProps) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [kind, setKind] = useState<'All' | 'past_paper' | 'notes'>('All');
  const loginHref = '/login?redirect=/papers';
  const uploadHref = '/papers/upload';
  const isFiltered = Boolean(search.trim() || departmentId || kind !== 'All');

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-foreground dark:text-foreground-dark">
            Past Papers &amp; Notes
          </h1>
          <p className="text-sm text-muted dark:text-muted-dark">
            Sign in with Google to browse approved papers, download files, or upload your own.
          </p>
        </div>
        {hasHydrated && isAuthenticated && (
          <Link
            href={uploadHref}
            className="inline-flex w-fit items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Upload paper
          </Link>
        )}
      </div>

      {hasHydrated && !isAuthenticated && (
        <div className="rounded-2xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
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
        <>

      <div className="max-w-xl">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search papers, subjects..." />
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
      <div className="mt-2 flex flex-wrap">
        <Chip label="All departments" selected={!departmentId} onPress={() => setDepartmentId(null)} />
        {departments.map((d) => (
          <Chip
            key={d.id}
            label={d.name}
            selected={departmentId === d.id}
            onPress={() => setDepartmentId(d.id)}
          />
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <StateMessage icon={AlertTriangle} title="Couldn't load papers" subtitle={error} />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((paper, index) => {
              const fileType = getPaperFileType(paper.fileUrl);
              return (
                <AnimatedListItem key={paper.id} index={index}>
                  <a
                    href={paper.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    <Card className="h-full">
                      <div className="flex items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                          {fileType === 'pdf' ? (
                            <FileText size={20} className="text-accent" />
                          ) : (
                            <ImageIcon size={20} className="text-accent" />
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground dark:text-foreground-dark">
                            {paper.title}
                          </p>
                          <p className="truncate text-sm text-muted dark:text-muted-dark">
                            {paper.subject} - {PAPER_KIND_LABELS[paper.kind]}
                            {paper.year ? ` - ${paper.year}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 truncate text-xs text-muted dark:text-muted-dark">
                        {paper.department ?? 'General'} - Uploaded by {paper.uploaderName} -{' '}
                        {paper.createdAt}
                      </p>
                    </Card>
                  </a>
                </AnimatedListItem>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
