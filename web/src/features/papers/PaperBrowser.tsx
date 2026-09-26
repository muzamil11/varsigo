'use client';

import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  type LucideIcon,
  LogIn,
  MessageCircle,
  RotateCw,
  Search as SearchIcon,
  UploadCloud,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { AnimatedListItem, Chip, Combobox, PageShell, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { useAuthStore } from '@/store/authStore';
import { fetchPapers } from './api';
import { PAPER_KIND_LABELS, buildDownloadUrl, getPaperFileType, type Paper, type PaperFolder } from './data';

interface PaperBrowserProps {
  papers: Paper[];
  departments: Department[];
  folders: PaperFolder[];
  error?: string | null;
}

/** Sentinel folderId value for "papers with no folder assigned yet" — never
 *  a real paper_folders.id, so it can share the folderId filter state. */
const UNCATEGORIZED_FOLDER_ID = '__uncategorized__';

/** One "browse by subject" tile — shows the count up front so a student
 *  never taps into an empty folder to find out. */
function FolderTile({
  icon: Icon,
  label,
  count,
  selected,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`rounded-2xl border p-3.5 text-left transition-transform duration-150 active:scale-[0.97] ${
        selected
          ? 'border-accent bg-accent/10'
          : 'border-line bg-card hover:border-accent/40 dark:border-line-dark dark:bg-card-dark'
      }`}
    >
      <Icon size={18} className={selected ? 'text-accent' : 'text-muted dark:text-muted-dark'} />
      <p
        className={`mt-2 truncate text-sm font-semibold ${selected ? 'text-accent' : 'text-foreground dark:text-foreground-dark'}`}
      >
        {label}
      </p>
      <p className="text-xs text-muted dark:text-muted-dark">
        {count} {count === 1 ? 'paper' : 'papers'}
      </p>
    </button>
  );
}

export function PaperBrowser({ papers: initialPapers, departments, folders, error }: PaperBrowserProps) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [papers, setPapers] = useState(initialPapers);
  const [refreshState, setRefreshState] = useState<'idle' | 'loading' | 'settled'>('idle');
  const [clientError, setClientError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [kind, setKind] = useState<'All' | 'past_paper' | 'notes'>('All');
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const loginHref = '/login?redirect=/papers';
  const uploadHref = '/papers/upload';
  const isFiltered = Boolean(search.trim() || departmentId || folderId || kind !== 'All');
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((p) => {
      if (kind !== 'All' && p.kind !== kind) return false;
      if (departmentId) {
        const dept = departments.find((d) => d.id === departmentId);
        if (dept && p.department !== dept.name) return false;
      }
      if (folderId === UNCATEGORIZED_FOLDER_ID) {
        if (p.folderId !== null) return false;
      } else if (folderId && p.folderId !== folderId) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        (p.department ?? '').toLowerCase().includes(q)
      );
    });
  }, [papers, search, departmentId, folderId, kind, departments]);

  /** Paper counts per folder, shown on the folder cards below so a student
   *  knows what's inside before tapping in — never has to guess or open an
   *  empty folder. */
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorized = 0;
    for (const p of papers) {
      if (p.folderId) counts.set(p.folderId, (counts.get(p.folderId) ?? 0) + 1);
      else uncategorized += 1;
    }
    return { counts, uncategorized };
  }, [papers]);

  const selectedFolderName =
    folderId === UNCATEGORIZED_FOLDER_ID
      ? 'Uncategorized'
      : (folders.find((f) => f.id === folderId)?.name ?? null);

  const openPreview = (paper: Paper, index: number) => {
    setPreviewPaper(paper);
    setPreviewIndex(index);
  };
  const closePreview = () => setPreviewPaper(null);
  const previewFiles = previewPaper
    ? previewPaper.fileUrls.length > 0
      ? previewPaper.fileUrls
      : [previewPaper.fileUrl]
    : [];
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!previewPaper) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [previewPaper]);

  // Rotation is a display-only fix for a crooked scan — it never touches the
  // stored file, so it resets whenever a different page or paper is opened.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional, resets the rotation once a different page/paper is actually open
    setRotation(0);
  }, [previewPaper, previewIndex]);

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
            {folders.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold text-foreground dark:text-foreground-dark">
                  Browse by subject
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <FolderTile
                    icon={LayoutGrid}
                    label="All papers"
                    count={papers.length}
                    selected={folderId === null}
                    onPress={() => setFolderId(null)}
                  />
                  {folders.map((folder) => (
                    <FolderTile
                      key={folder.id}
                      icon={Folder}
                      label={folder.name}
                      count={folderCounts.counts.get(folder.id) ?? 0}
                      selected={folderId === folder.id}
                      onPress={() => setFolderId(folder.id)}
                    />
                  ))}
                  {folderCounts.uncategorized > 0 && (
                    <FolderTile
                      icon={FolderOpen}
                      label="Uncategorized"
                      count={folderCounts.uncategorized}
                      selected={folderId === UNCATEGORIZED_FOLDER_ID}
                      onPress={() => setFolderId(UNCATEGORIZED_FOLDER_ID)}
                    />
                  )}
                </div>
              </div>
            )}

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
                <Combobox
                  id="paper-department"
                  value={departmentId ?? ''}
                  onChange={(v) => setDepartmentId(v || null)}
                  options={[
                    { value: '', label: 'All departments' },
                    ...departments.map((department) => ({ value: department.id, label: department.name })),
                  ]}
                  className="h-12 rounded-full border border-line bg-card px-4 text-sm text-foreground focus:border-accent dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
                />
              </div>

              <div className="mt-4 flex flex-wrap">
                <Chip label="All" selected={kind === 'All'} onPress={() => setKind('All')} />
                <Chip
                  label="Past Papers"
                  selected={kind === 'past_paper'}
                  onPress={() => setKind('past_paper')}
                />
                <Chip label="Notes" selected={kind === 'notes'} onPress={() => setKind('notes')} />
              </div>
            </div>

            <div className="mt-6">
              {!visibleError && (
                <p className="mb-3 text-sm text-muted dark:text-muted-dark">
                  Showing {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
                  {selectedFolderName ? ` in "${selectedFolderName}"` : ''}
                  {search.trim() ? ` matching "${search.trim()}"` : ''}
                </p>
              )}
              {visibleError ? (
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
                    const files = paper.fileUrls.length > 0 ? paper.fileUrls : [paper.fileUrl];
                    const fileType = getPaperFileType(files[0]);
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
                              {paper.folderName && (
                                <span className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent">
                                  {paper.folderName}
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
                            <Link
                              href={`/papers/${paper.id}/questions?title=${encodeURIComponent(paper.title)}`}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent"
                            >
                              <MessageCircle size={12} />
                              {paper.questionCount > 0
                                ? `${paper.questionCount} question${paper.questionCount === 1 ? '' : 's'}`
                                : 'Ask a question'}
                            </Link>
                          </div>

                          {files.length <= 1 ? (
                            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                              <button
                                type="button"
                                onClick={() => openPreview(paper, 0)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
                              >
                                <Eye size={15} />
                                View
                              </button>
                              <a
                                href={buildDownloadUrl(
                                  files[0],
                                  `${paper.title}.${files[0].split('?')[0].split('.').pop() ?? 'pdf'}`,
                                )}
                                download
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white"
                              >
                                <Download size={15} />
                                Download
                              </a>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-xs font-semibold text-muted dark:text-muted-dark">
                                {files.length} pages
                              </p>
                              {files.map((url, fileIndex) => (
                                <div key={url} className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openPreview(paper, fileIndex)}
                                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line text-xs font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
                                  >
                                    <Eye size={13} />
                                    Page {fileIndex + 1}
                                  </button>
                                  <a
                                    href={buildDownloadUrl(
                                      url,
                                      `${paper.title}-page-${fileIndex + 1}.${
                                        url.split('?')[0].split('.').pop() ?? 'pdf'
                                      }`,
                                    )}
                                    download
                                    aria-label={`Download page ${fileIndex + 1}`}
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white"
                                  >
                                    <Download size={13} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
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

      {previewPaper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closePreview}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card dark:bg-card-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 dark:border-line-dark">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground dark:text-foreground-dark">
                  {previewPaper.title}
                </p>
                {previewFiles.length > 1 && (
                  <p className="text-xs text-muted dark:text-muted-dark">
                    Page {previewIndex + 1} of {previewFiles.length}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {getPaperFileType(previewFiles[previewIndex]) === 'image' && (
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    aria-label="Rotate image"
                    title="Rotate"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-foreground dark:border-line-dark dark:text-foreground-dark"
                  >
                    <RotateCw size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close preview"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-foreground dark:border-line-dark dark:text-foreground-dark"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-background dark:bg-background-dark">
              {getPaperFileType(previewFiles[previewIndex]) === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file at full resolution, not worth Next/Image's static-size config here
                <img
                  src={previewFiles[previewIndex]}
                  alt={`${previewPaper.title} page ${previewIndex + 1}`}
                  style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease' }}
                  className={rotation % 180 === 0 ? 'max-w-full' : 'max-h-full'}
                />
              ) : (
                <iframe
                  src={previewFiles[previewIndex]}
                  title={`${previewPaper.title} page ${previewIndex + 1}`}
                  className="h-[75vh] w-full"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 dark:border-line-dark">
              {previewFiles.length > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    disabled={previewIndex === 0}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm font-semibold text-foreground disabled:opacity-40 dark:border-line-dark dark:text-foreground-dark"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => Math.min(previewFiles.length - 1, i + 1))}
                    disabled={previewIndex >= previewFiles.length - 1}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm font-semibold text-foreground disabled:opacity-40 dark:border-line-dark dark:text-foreground-dark"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <span />
              )}
              <a
                href={buildDownloadUrl(
                  previewFiles[previewIndex],
                  `${previewPaper.title}${previewFiles.length > 1 ? `-page-${previewIndex + 1}` : ''}.${
                    previewFiles[previewIndex].split('?')[0].split('.').pop() ?? 'pdf'
                  }`,
                )}
                download
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-white"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
