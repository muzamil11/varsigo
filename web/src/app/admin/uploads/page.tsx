'use client';

import { AlertTriangle, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage } from '@/components';
import { approveUpload, fetchPendingUploads, rejectUpload } from '@/features/admin/api';
import type { AdminUpload } from '@/features/admin/data';
import { PAPER_KIND_LABELS } from '@/features/papers/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminUploadsPage() {
  const user = useAuthStore((s) => s.user);
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    fetchPendingUploads(user.email)
      .then(setUploads)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);

  const handleApprove = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await approveUpload(user.email, id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
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

  if (loading) return <CardSkeletonList padded={false} />;
  if (error) return <StateMessage icon={AlertTriangle} title="Couldn't load uploads" subtitle={error} />;
  if (uploads.length === 0) {
    return <StateMessage icon={Check} title="All caught up" subtitle="No pending uploads." />;
  }

  return (
    <div>
      {uploads.map((upload) => (
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
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleReject(upload.id)}
                disabled={busyId === upload.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
