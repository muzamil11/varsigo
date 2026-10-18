'use client';

import { FileQuestion, FileText, HelpCircle, LogIn, MessageCircle, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { PageShell, SearchBar, StateMessage } from '@/components';
import { FAQS } from '@/features/faq/data';
import { fetchPapers } from '@/features/papers/api';
import type { Paper } from '@/features/papers/data';
import { fetchQuestions } from '@/features/questions/api';
import type { QuestionListItem } from '@/features/questions/data';
import { fetchTeachers } from '@/features/teachers/api';
import type { TeacherListItem } from '@/features/teachers/data';
import { useSearchTracking } from '@/lib/useSearchTracking';
import { useAuthStore } from '@/store/authStore';
import {
  SEARCH_CATEGORY_LABELS,
  searchFaqs,
  searchPapers,
  searchQuestions,
  searchTeachers,
  type SearchResult,
  type SearchResultCategory,
} from './data';

const CATEGORY_ICONS: Record<SearchResultCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  teacher: Users,
  paper: FileText,
  faq: HelpCircle,
  question: MessageCircle,
};

const MAX_RESULTS_PER_CATEGORY = 8;

export function GlobalSearch() {
  const searchParams = useSearchParams();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  useSearchTracking('global', query);

  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Papers and FAQ are public — load regardless of sign-in state.
  useEffect(() => {
    fetchPapers()
      .then(setPapers)
      .catch(() => setPapers([]))
      .finally(() => setPapersLoading(false));
  }, []);

  // Teachers and Q&A are sign-in-gated content throughout the rest of the
  // app (reviews/questions are only ever shown to signed-in students) — a
  // global search box isn't a different door into the same content, so it
  // only fetches these once the visitor is actually authenticated.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional, kicking off a load once signed in
    setTeachersLoading(true);
    setQuestionsLoading(true);
    fetchTeachers()
      .then(setTeachers)
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
    fetchQuestions()
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }, [hasHydrated, isAuthenticated]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const results: Record<SearchResultCategory, SearchResult[]> = hasQuery
    ? {
        teacher: searchTeachers(teachers, trimmedQuery),
        paper: searchPapers(papers, trimmedQuery),
        faq: searchFaqs(FAQS, trimmedQuery),
        question: searchQuestions(questions, trimmedQuery),
      }
    : { teacher: [], paper: [], faq: [], question: [] };

  const totalResults = Object.values(results).reduce((sum, list) => sum + list.length, 0);
  const anyLoading = papersLoading || (hasHydrated && isAuthenticated && (teachersLoading || questionsLoading));

  return (
    <PageShell className="max-w-3xl py-10">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
        <Search size={16} />
        Search NEDHub
      </div>
      <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark sm:text-4xl">
        Search everything
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted dark:text-muted-dark sm:text-base">
        One box for Teachers, Papers, FAQ, and Q&amp;A — no need to know which page to check.
      </p>

      <div className="mt-6">
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search teachers, papers, FAQs, questions…" />
      </div>

      {hasHydrated && !isAuthenticated && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-xs text-muted dark:border-line-dark dark:bg-card-dark dark:text-muted-dark">
          <LogIn size={14} className="shrink-0 text-accent" />
          <span>
            Searching Papers and FAQ only.{' '}
            <Link href="/login?redirect=/search" className="font-medium text-accent underline">
              Sign in
            </Link>{' '}
            to also search Teachers and Q&amp;A.
          </span>
        </div>
      )}

      <div className="mt-8">
        {!hasQuery ? (
          <StateMessage
            icon={Search}
            title="Start typing to search"
            subtitle="Results from Teachers, Papers, FAQ, and Q&A will show up here."
          />
        ) : anyLoading && totalResults === 0 ? (
          <StateMessage icon={Search} title="Searching…" />
        ) : totalResults === 0 ? (
          <StateMessage
            icon={FileQuestion}
            title="No results"
            subtitle={`Nothing matched "${trimmedQuery}". Try a different search.`}
          />
        ) : (
          <div className="space-y-8">
            {(Object.keys(results) as SearchResultCategory[]).map((category) => {
              const items = results[category];
              if (items.length === 0) return null;
              const Icon = CATEGORY_ICONS[category];
              const shown = items.slice(0, MAX_RESULTS_PER_CATEGORY);

              return (
                <div key={category}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon size={16} className="text-accent" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground dark:text-foreground-dark">
                      {SEARCH_CATEGORY_LABELS[category]}
                    </h2>
                    <span className="text-xs text-muted dark:text-muted-dark">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {shown.map((result) => (
                      <Link
                        key={`${result.category}-${result.id}`}
                        href={result.href}
                        className="block rounded-xl border border-line bg-card px-4 py-3 transition-colors hover:border-accent/40 dark:border-line-dark dark:bg-card-dark"
                      >
                        <p className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                          {result.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">{result.subtitle}</p>
                      </Link>
                    ))}
                  </div>
                  {items.length > MAX_RESULTS_PER_CATEGORY && (
                    <p className="mt-2 text-xs text-muted dark:text-muted-dark">
                      +{items.length - MAX_RESULTS_PER_CATEGORY} more — try a more specific search.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
