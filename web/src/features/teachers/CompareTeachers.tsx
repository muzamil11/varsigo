'use client';

import { Info, LogIn, MessageSquareOff, Trophy } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Card, SkeletonBlock, StateMessage } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { useAuthStore } from '@/store/authStore';
import { fetchTeachersForCompare } from './api';
import {
  breakdownMetricValue,
  buildWinnerReasons,
  compareColorAt,
  computeMetricWinnerId,
  computeOverallWinnerId,
  summarizeForCompare,
} from './compare';
import {
  reviewOverall,
  reviewSentiment,
  TEACHER_QUALITY_TAGS,
  type TeacherDetail,
  type TeacherReview,
} from './data';
import type { PublicTeacherListItem } from './TeacherBrowser';

const SENTIMENT_BORDER_COLOR = { positive: '#10B981', neutral: '#A1A1AA', negative: '#EF4444' } as const;

/** One review, in full — no truncation and no algorithmic curation, so a
 *  student comparing teachers can read every comment themselves instead of
 *  trusting a "top pick". The left border color echoes the same sentiment
 *  bucket as the pill counts above it. */
function ReviewRow({ review }: { review: TeacherReview }) {
  const sentiment = reviewSentiment(reviewOverall(review));
  return (
    <div
      style={{ borderLeftWidth: 3, borderLeftColor: SENTIMENT_BORDER_COLOR[sentiment] }}
      className="mb-2 rounded-r-lg bg-background py-1.5 pl-2.5 pr-2 dark:bg-background-dark"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-foreground dark:text-foreground-dark">
          {review.author}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent">
          ⭐ {reviewOverall(review).toFixed(1)}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted dark:text-muted-dark">
        {review.course && <span className="truncate">{formatCourse(review.course)}</span>}
        <span className="shrink-0">{review.createdAt}</span>
      </div>
      {review.comment && (
        <p className="mt-1 text-xs leading-5 text-muted dark:text-muted-dark">{review.comment}</p>
      )}
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');
}

/** One horizontal bar for a single teacher — reused by both the "Overall
 *  rating" section and each metric row in "Rating breakdown". */
function TeacherBarRow({
  name,
  color,
  value,
  trophy,
}: {
  name: string;
  color: string;
  value: number | null;
  trophy?: boolean;
}) {
  const pct = value !== null ? Math.max(4, Math.min(100, (value / 5) * 100)) : 0;
  return (
    <div className="mb-3 flex items-center gap-3">
      <span style={{ backgroundColor: color }} className="h-2.5 w-2.5 shrink-0 rounded-full" />
      <span className="w-28 shrink-0 truncate text-xs text-muted dark:text-muted-dark" title={name}>
        {name}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        {value !== null && (
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </div>
      {trophy && <Trophy size={13} className="shrink-0 text-amber-500" />}
      <span className="w-9 shrink-0 text-right text-xs font-semibold text-foreground dark:text-foreground-dark">
        {value !== null ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

const SENTIMENT_PILL_STYLES = {
  positive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  neutral: 'bg-line text-muted dark:bg-line-dark dark:text-muted-dark',
  negative: 'bg-red-500/15 text-red-600 dark:text-red-400',
} as const;

function SentimentPill({ label, tone }: { label: string; tone: keyof typeof SENTIMENT_PILL_STYLES }) {
  return (
    <span
      className={`mb-1.5 mr-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${SENTIMENT_PILL_STYLES[tone]}`}
    >
      {label}
    </span>
  );
}

/** "What students are saying" — the only part of this page that reads
 *  review comments, so (like ReviewsSection on the teacher detail page) it
 *  fetches client-side and only once the visitor is confirmed signed in.
 *  Everything else in CompareTeachers renders from the public aggregate
 *  data (rating/breakdown) the server component already fetched. */
function SentimentSection({ ids }: { ids: string[] }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [teachers, setTeachers] = useState<TeacherDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- not fetching in this branch, just resolving initial loading state
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchTeachersForCompare(ids)
      .then((data) => {
        if (!cancelled) setTeachers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reviews.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids is the joined query param, stable for this page's lifetime
  }, [ids.join(','), hasHydrated, isAuthenticated]);

  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center dark:border-line-dark dark:bg-card-dark">
        <LogIn className="mx-auto text-muted dark:text-muted-dark" size={28} />
        <p className="mt-3 text-base font-semibold text-foreground dark:text-foreground-dark">
          Sign in to see what students are saying
        </p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">
          Review comments are only visible to signed-in students.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/teachers/compare?ids=${ids.join(',')}`)}`}
          className="mt-4 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white"
        >
          Sign in with Google
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {ids.map((id) => (
          <div key={id} className="rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-3 h-3 w-full max-w-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !teachers) {
    return <StateMessage icon={MessageSquareOff} title="Couldn't load reviews" subtitle={error ?? undefined} />;
  }

  return (
    <div className="space-y-3">
      {teachers.map((t, i) => {
        const summary = summarizeForCompare(t);
        return (
          <Card key={t.id}>
            <div className="mb-2 flex items-center gap-2">
              <span style={{ backgroundColor: compareColorAt(i) }} className="h-2.5 w-2.5 shrink-0 rounded-full" />
              <p className="truncate text-sm font-semibold text-foreground dark:text-foreground-dark">{t.name}</p>
            </div>
            {t.reviewCount === 0 ? (
              <p className="text-xs text-muted dark:text-muted-dark">No reviews yet.</p>
            ) : (
              <>
                <div className="flex flex-wrap">
                  {summary.positive > 0 && <SentimentPill label={`${summary.positive} positive`} tone="positive" />}
                  {summary.neutral > 0 && <SentimentPill label={`${summary.neutral} neutral`} tone="neutral" />}
                  {summary.negative > 0 && <SentimentPill label={`${summary.negative} negative`} tone="negative" />}
                </div>
                <div className="mt-2">
                  {t.reviews.map((review) => (
                    <ReviewRow key={review.id} review={review} />
                  ))}
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/** `teachers` always has at least MIN_COMPARE_TEACHERS entries — the server
 *  page redirects to /teachers otherwise, since that's only reachable via a
 *  hand-edited or stale URL rather than the app's own "Compare" button. */
export function CompareTeachers({ teachers }: { teachers: PublicTeacherListItem[] }) {
  const winnerId = computeOverallWinnerId(teachers);
  const winner = winnerId ? teachers.find((t) => t.id === winnerId) ?? null : null;
  const winnerReasons = winner
    ? buildWinnerReasons(
        winner,
        teachers.filter((t) => t.id !== winnerId),
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/teachers" className="text-sm font-medium text-accent underline">
        ← All teachers
      </Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold text-foreground dark:text-foreground-dark">
        Compare Teachers
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {teachers.map((t, i) => (
          <Link
            key={t.id}
            href={`/teachers/${t.id}`}
            className="rounded-2xl border border-line bg-card p-3 transition-transform duration-150 hover:-translate-y-0.5 dark:border-line-dark dark:bg-card-dark"
          >
            <div className="flex items-center gap-2">
              <span style={{ backgroundColor: compareColorAt(i) }} className="h-2.5 w-2.5 shrink-0 rounded-full" />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15">
                <span className="text-xs font-semibold text-accent">{initialsOf(t.name)}</span>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
              {t.name}
            </p>
            {t.department && (
              <p className="mt-0.5 truncate text-[11px] text-muted dark:text-muted-dark">{t.department}</p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs">
              <span className="font-medium text-accent">⭐ {t.rating !== null ? t.rating.toFixed(1) : '—'}</span>
              <span className="text-muted dark:text-muted-dark">({t.reviewCount})</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-4">
        {winner ? (
          <>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="shrink-0 text-amber-500" />
              <p className="text-base font-semibold text-foreground dark:text-foreground-dark">
                Our pick: {winner.name}
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-muted dark:text-muted-dark">
              {winnerReasons.length > 0
                ? winnerReasons.join(' · ')
                : `Highest overall rating — ${winner.rating!.toFixed(1)}★ from ${winner.reviewCount} ${winner.reviewCount === 1 ? 'review' : 'reviews'}.`}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Info size={18} className="shrink-0 text-muted dark:text-muted-dark" />
            <p className="text-sm text-muted dark:text-muted-dark">
              Not enough reviews yet to call a clear winner — compare the details below.
            </p>
          </div>
        )}
      </div>

      <Card className="mt-6">
        <p className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">Overall rating</p>
        {teachers.map((t, i) => (
          <TeacherBarRow key={t.id} name={t.name} color={compareColorAt(i)} value={t.rating} />
        ))}
      </Card>

      <Card className="mt-6">
        <p className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">Rating breakdown</p>
        {TEACHER_QUALITY_TAGS.map((tag, tagIndex) => {
          const metricWinnerId = computeMetricWinnerId(teachers, tag.key);
          return (
            <div key={tag.key} className={tagIndex > 0 ? 'mt-5' : undefined}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
                {tag.label}
              </p>
              {teachers.map((t, i) => (
                <TeacherBarRow
                  key={t.id}
                  name={t.name}
                  color={compareColorAt(i)}
                  value={breakdownMetricValue(t.breakdown, tag.key)}
                  trophy={t.id === metricWinnerId}
                />
              ))}
            </div>
          );
        })}
      </Card>

      <p className="mb-3 mt-8 text-base font-semibold text-foreground dark:text-foreground-dark">
        What students are saying
      </p>
      <SentimentSection ids={teachers.map((t) => t.id)} />
    </div>
  );
}
