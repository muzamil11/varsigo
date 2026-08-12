'use client';

import { Clock, Flag, LogIn, MessageSquareOff, Star } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Button, SkeletonBlock, StateMessage } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { useAuthStore } from '@/store/authStore';
import type { TeacherDetail } from './data';
import { fetchTeacherById, reportReview } from './api';

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-muted dark:text-muted-dark">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-medium text-foreground dark:text-foreground-dark">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function ReviewsSection({ teacherId }: { teacherId: string }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const userId = useAuthStore((s) => s.user?.id);
  const [detail, setDetail] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- not fetching in this branch, just resolving initial loading state
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchTeacherById(teacherId, userId)
      .then((data) => {
        if (!cancelled) setDetail(data);
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
  }, [teacherId, hasHydrated, isAuthenticated, userId]);

  const handleReport = async (reviewId: string) => {
    try {
      await reportReview(reviewId);
      setReportedIds((prev) => new Set(prev).add(reviewId));
    } catch {
      // best-effort — no toast system on web yet
    }
  };

  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-card p-6 text-center dark:border-line-dark dark:bg-card-dark">
        <LogIn className="mx-auto text-muted dark:text-muted-dark" size={28} />
        <p className="mt-3 text-base font-semibold text-foreground dark:text-foreground-dark">
          Sign in to see reviews
        </p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">
          Ratings and student reviews for this teacher are only visible to signed-in students.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/teachers/${teacherId}`)}`}
          className="mt-4 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white"
        >
          Sign in with Google
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-card p-5 dark:border-line-dark dark:bg-card-dark">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="mt-2 h-3 w-20" />
          </div>
          <SkeletonBlock className="h-11 w-32 rounded-xl" />
        </div>
        <div className="mt-6 space-y-3">
          <SkeletonBlock className="h-4 w-full max-w-xl" />
          <SkeletonBlock className="h-4 w-5/6 max-w-lg" />
          <SkeletonBlock className="h-4 w-2/3 max-w-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return <StateMessage icon={MessageSquareOff} title="Couldn't load reviews" subtitle={error} />;
  }

  if (!detail) return null;

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            {detail.rating ? detail.rating.toFixed(1) : '—'}
          </p>
          <p className="text-sm text-muted dark:text-muted-dark">
            {detail.reviewCount} review{detail.reviewCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/questions?askTeacherId=${teacherId}&askTeacherName=${encodeURIComponent(detail.name)}&openAsk=1`}
          >
            <Button label="Ask a question" variant="ghost" />
          </Link>
          <Link href={`/teachers/${teacherId}/add-review`}>
            <Button label="Write a review" />
          </Link>
        </div>
      </div>

      {detail.breakdown && (
        <div className="mb-6 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
          <RatingBar label="Teaching" value={detail.breakdown.teaching} />
          <RatingBar label="Grading" value={detail.breakdown.grading} />
          <RatingBar label="Attendance" value={detail.breakdown.attendance} />
        </div>
      )}

      {detail.myPendingReviews.map((review) => (
        <div
          key={review.id}
          className="mb-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Clock size={12} />
              Pending approval
            </span>
            <span className="text-xs text-muted dark:text-muted-dark">{review.createdAt}</span>
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-foreground dark:text-foreground-dark">{review.comment}</p>
          )}
          <div className="mt-3 flex gap-4 text-xs text-muted dark:text-muted-dark">
            <span>Teaching {review.teaching}/5</span>
            <span>Grading {review.grading}/5</span>
            <span>Attendance {review.attendance}/5</span>
          </div>
          <p className="mt-3 text-xs text-muted dark:text-muted-dark">
            Only visible to you until a moderator approves it.
          </p>
        </div>
      ))}

      {detail.reviews.length === 0 ? (
        <StateMessage
          icon={Star}
          title={detail.myPendingReviews.length > 0 ? 'No approved reviews yet' : 'No reviews yet'}
          subtitle={
            detail.myPendingReviews.length > 0
              ? undefined
              : 'Be the first to review this teacher.'
          }
        />
      ) : (
        detail.reviews.map((review) => (
          <div
            key={review.id}
            className="mb-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                  {review.author}
                </p>
                <p className="text-xs text-muted dark:text-muted-dark">{review.createdAt}</p>
              </div>
              <button
                type="button"
                onClick={() => handleReport(review.id)}
                disabled={reportedIds.has(review.id)}
                className="flex items-center gap-1 text-xs text-muted disabled:opacity-50 dark:text-muted-dark"
                title="Report this review"
              >
                <Flag size={12} />
                {reportedIds.has(review.id) ? 'Reported' : 'Report'}
              </button>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-foreground dark:text-foreground-dark">
                {review.comment}
              </p>
            )}
            {review.course && (
              <p className="mt-3 inline-flex rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                {formatCourse(review.course)}
              </p>
            )}
            <div className="mt-3 flex gap-4 text-xs text-muted dark:text-muted-dark">
              <span>Teaching {review.teaching}/5</span>
              <span>Grading {review.grading}/5</span>
              <span>Attendance {review.attendance}/5</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
