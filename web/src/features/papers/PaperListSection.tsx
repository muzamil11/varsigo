'use client';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  RotateCw,
  Search as SearchIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { AnimatedListItem, Chip, Combobox, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { PAPER_KIND_LABELS, buildDownloadUrl, getPaperFileType, type Paper } from './data';

interface PaperListSectionProps {
  papers: Paper[];
  departments: Department[];
  searchPlaceholder?: string;
  /** Shown on each card's badge row — turned off on a folder's own page,
   *  where every card already belongs to that folder and repeating its
   *  name would be noise. */
  showFolderBadge?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  uploadHref?: string;
}

/** The search + filters + card list + preview modal shared by the main
 *  Papers page (for uncategorized papers) and a single folder's page (for
 *  its papers) — the two only differ in which `papers` they're handed. */
export function PaperListSection({
  papers,
  departments,
  searchPlaceholder = 'Search papers, subjects...',
  showFolderBadge = true,
  emptyTitle = 'No papers here yet',
  emptySubtitle = 'Uploaded papers appear here after admin approval.',
  uploadHref = '/papers/upload',
}: PaperListSectionProps) {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [kind, setKind] = useState<'All' | 'past_paper' | 'notes'>('All');
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
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

  return (
    <>
      <div className="rounded-2xl border border-line bg-background p-4 dark:border-line-dark dark:bg-background-dark">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_260px]">
          <SearchBar value={search} onChangeText={setSearch} placeholder={searchPlaceholder} />
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
          <Chip label="Past Papers" selected={kind === 'past_paper'} onPress={() => setKind('past_paper')} />
          <Chip label="Notes" selected={kind === 'notes'} onPress={() => setKind('notes')} />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm text-muted dark:text-muted-dark">
          Showing {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
          {search.trim() ? ` matching "${search.trim()}"` : ''}
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
            <StateMessage
              icon={SearchIcon}
              title={papers.length === 0 ? emptyTitle : 'No matching papers'}
              subtitle={papers.length === 0 ? emptySubtitle : isFiltered ? 'Try a different search or filter.' : 'Approved papers will show here.'}
            />
            {papers.length === 0 && (
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
                        {showFolderBadge && paper.folderName && (
                          <span className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent">
                            {paper.folderName}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-foreground dark:text-foreground-dark">
                        {paper.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted dark:text-muted-dark">{paper.subject}</p>
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

      {previewPaper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-6"
          onClick={closePreview}
        >
          <div
            className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:h-[92vh] sm:w-[92vw] sm:max-w-6xl dark:bg-card-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6 sm:py-4 dark:border-line-dark">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground dark:text-foreground-dark">
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
                    aria-label="Rotate image 90 degrees"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium text-foreground dark:border-line-dark dark:text-foreground-dark"
                  >
                    <RotateCw size={15} />
                    <span className="hidden sm:inline">Rotate</span>
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

            <div className="flex flex-1 items-center justify-center overflow-hidden bg-background p-2 sm:p-6 dark:bg-background-dark">
              {getPaperFileType(previewFiles[previewIndex]) === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file at full resolution, not worth Next/Image's static-size config here
                <img
                  src={previewFiles[previewIndex]}
                  alt={`${previewPaper.title} page ${previewIndex + 1}`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    maxWidth: rotation % 180 !== 0 ? '75vh' : '100%',
                    maxHeight: rotation % 180 !== 0 ? '82vw' : '100%',
                  }}
                  className="rounded-lg object-contain"
                />
              ) : (
                <iframe
                  src={previewFiles[previewIndex]}
                  title={`${previewPaper.title} page ${previewIndex + 1}`}
                  className="h-full w-full rounded-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-6 sm:py-4 dark:border-line-dark">
              {previewFiles.length > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    disabled={previewIndex === 0}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-3 text-sm font-semibold text-foreground disabled:opacity-40 dark:border-line-dark dark:text-foreground-dark"
                  >
                    <ChevronLeft size={15} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => Math.min(previewFiles.length - 1, i + 1))}
                    disabled={previewIndex >= previewFiles.length - 1}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-3 text-sm font-semibold text-foreground disabled:opacity-40 dark:border-line-dark dark:text-foreground-dark"
                  >
                    <span className="hidden sm:inline">Next</span>
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
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-white"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
