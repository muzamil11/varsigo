'use client';

import { AlertTriangle, Check, Flag, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage } from '@/components';
import { approveReview, fetchPendingReviews, rejectReview } from '@/features/admin/api';
import type { AdminReview } from '@/features/admin/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminReviewsPage() {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    fetchPendingReviews(user.email)
      .then(setReviews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);

  const handleApprove = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await approveReview(user.email, id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await rejectReview(user.email, id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <CardSkeletonList padded={false} />;
  if (error) return <StateMessage icon={AlertTriangle} title="Couldn't load reviews" subtitle={error} />;
  if (reviews.length === 0) {
    return <StateMessage icon={Check} title="All caught up" subtitle="No pending reviews." />;
  }

  return (
    <div>
      {reviews.map((review) => (
        <div
          key={review.id}
          className="mb-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground dark:text-foreground-dark">
                {review.teacherName}
              </p>
              {review.courseName && (
                <p className="text-xs font-medium text-accent">{review.courseName}</p>
              )}
              <p className="text-xs text-muted dark:text-muted-dark">
                {review.submittedBy} · {review.createdAt}
                {review.reported && <span className="ml-2 text-red-500">Reported</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApprove(review.id)}
                disabled={busyId === review.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleReject(review.id)}
                disabled={busyId === review.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-foreground dark:text-foreground-dark">{review.comment}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted dark:text-muted-dark">
            <span>Teaching {review.teachingScore}/5</span>
            <span>Grading {review.gradingScore}/5</span>
            <span>Attendance leniency {review.attendanceScore}/5</span>
            <span>Helpfulness {review.helpfulnessScore}/5</span>
            {review.qualityFlags.length > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Flag size={12} /> {review.qualityFlags.join(', ')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
