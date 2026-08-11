'use client';

import { AlertTriangle, Check, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage } from '@/components';
import {
  approveUpload,
  fetchApprovedUploads,
  fetchPendingUploads,
  rejectUpload,
} from '@/features/admin/api';
import type { AdminUpload } from '@/features/admin/data';
import { PAPER_KIND_LABELS } from '@/features/papers/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminUploadsPage() {
  const user = useAuthStore((s) => s.user);
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [published, setPublished] = useState<AdminUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishedLoading, setPublishedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishedError, setPublishedError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    fetchPendingUploads(user.email)
      .then(setUploads)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  const loadPublished = () => {
    if (!user?.email) return;
    setPublishedLoading(true);
    fetchApprovedUploads(user.email)
      .then(setPublished)
      .catch((err) => setPublishedError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setPublishedLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(loadPublished, [user?.email]);

  const handleApprove = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await approveUpload(user.email, id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
      loadPublished();
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
      await rejectUpload(user.email, id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePublished = async (id: string) => {
    if (!user?.email) return;
    if (!window.confirm('Delete this paper? It will be removed from the site immediately.')) return;
    setBusyId(id);
    try {
      await rejectUpload(user.email, id);
      setPublished((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setPublishedError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
        Pending review
      </h2>
      {loading ? (
        <CardSkeletonList padded={false} />
      ) : error ? (
        <StateMessage icon={AlertTriangle} title="Couldn't load uploads" subtitle={error} />
      ) : uploads.length === 0 ? (
        <StateMessage icon={Check} title="All caught up" subtitle="No pending uploads." />
      ) : (
        uploads.map((upload) => (
          <div
            key={upload.id}
            className="mb-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
          >
            <div className="flex items-start justify-between">
              <div>
                <a
                  href={upload.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline dark:text-foreground-dark"
                >
                  {upload.title}
                </a>
                <p className="text-xs text-muted dark:text-muted-dark">
                  {upload.subject} · {PAPER_KIND_LABELS[upload.kind]} · {upload.department ?? 'General'}
                  {upload.year ? ` · ${upload.year}` : ''} · {upload.createdAt}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(upload.id)}
                  disabled={busyId === upload.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 disabled:opacity-50"
                  title="Approve"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(upload.id)}
                  disabled={busyId === upload.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
                  title="Reject"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <h2 className="mb-3 mt-8 text-base font-semibold text-foreground dark:text-foreground-dark">
        Published papers
      </h2>
      <p className="mb-3 text-xs text-muted dark:text-muted-dark">
        Already live on /papers — delete one to remove it from the site immediately.
      </p>
      {publishedLoading ? (
        <CardSkeletonList padded={false} />
      ) : publishedError ? (
        <StateMessage icon={AlertTriangle} title="Couldn't load published papers" subtitle={publishedError} />
      ) : published.length === 0 ? (
        <StateMessage icon={Check} title="Nothing published yet" />
      ) : (
        published.map((upload) => (
          <div
            key={upload.id}
            className="mb-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
          >
            <div className="flex items-start justify-between">
              <div>
                <a
                  href={upload.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline dark:text-foreground-dark"
                >
                  {upload.title}
                </a>
                <p className="text-xs text-muted dark:text-muted-dark">
                  {upload.subject} · {PAPER_KIND_LABELS[upload.kind]} · {upload.department ?? 'General'}
                  {upload.year ? ` · ${upload.year}` : ''} · {upload.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeletePublished(upload.id)}
                disabled={busyId === upload.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
