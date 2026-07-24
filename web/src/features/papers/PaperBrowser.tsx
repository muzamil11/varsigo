'use client';

import { AlertTriangle, FileText, Image as ImageIcon, Search as SearchIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { AnimatedListItem, Card, Chip, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { PAPER_KIND_LABELS, getPaperFileType, type Paper } from './data';

interface PaperBrowserProps {
  papers: Paper[];
  departments: Department[];
  error?: string | null;
}

export function PaperBrowser({ papers, departments, error }: PaperBrowserProps) {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [kind, setKind] = useState<'All' | 'past_paper' | 'notes'>('All');

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
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-foreground dark:text-foreground-dark">
        Past Papers &amp; Notes
      </h1>
      <p className="mb-4 text-sm text-muted dark:text-muted-dark">
        Free to browse and download — shared by NED students.
      </p>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search papers, subjects…" />

      <div className="mt-3 flex flex-wrap">
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

      <div className="mt-4">
        {error ? (
          <StateMessage icon={AlertTriangle} title="Couldn't load papers" subtitle={error} />
        ) : filtered.length === 0 ? (
          <StateMessage
            icon={SearchIcon}
            title="No papers found"
            subtitle="Try a different search or filter."
          />
        ) : (
          filtered.map((paper, index) => {
            const fileType = getPaperFileType(paper.fileUrl);
            return (
              <AnimatedListItem key={paper.id} index={index}>
                <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="mb-3 block">
                  <Card>
                    <div className="flex items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        {fileType === 'pdf' ? (
                          <FileText size={20} className="text-accent" />
                        ) : (
                          <ImageIcon size={20} className="text-accent" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-foreground dark:text-foreground-dark">
                          {paper.title}
                        </p>
                        <p className="text-sm text-muted dark:text-muted-dark">
                          {paper.subject} · {PAPER_KIND_LABELS[paper.kind]}
                          {paper.year ? ` · ${paper.year}` : ''}
                        </p>
                        <p className="text-xs text-muted dark:text-muted-dark">
                          {paper.department ?? 'General'} · Uploaded by {paper.uploaderName} ·{' '}
                          {paper.createdAt}
                        </p>
                      </div>
                    </div>
                  </Card>
                </a>
              </AnimatedListItem>
            );
          })
        )}
      </div>
    </div>
  );
}
