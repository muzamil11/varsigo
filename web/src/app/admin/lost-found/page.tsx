'use client';

import { AlertTriangle, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage } from '@/components';
import {
  approveLostFoundItem,
  fetchPendingLostFoundItems,
  rejectLostFoundItem,
} from '@/features/lost-found/api';
import { LOST_FOUND_KIND_LABELS, type LostFoundItem } from '@/features/lost-found/data';

export default function AdminLostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchPendingLostFoundItems()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const moderate = async (item: LostFoundItem, action: 'approve' | 'reject') => {
    setBusyId(item.id);
    setError(null);
    try {
      if (action === 'approve') {
        await approveLostFoundItem(item.id);
      } else {
        await rejectLostFoundItem(item.id);
      }
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <CardSkeletonList padded={false} />;
  if (error) {
    return <StateMessage icon={AlertTriangle} title="Couldn't load Lost & Found" subtitle={error} />;
  }
  if (items.length === 0) {
    return <StateMessage icon={Check} title="All caught up" subtitle="No pending lost/found items." />;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                {LOST_FOUND_KIND_LABELS[item.kind]}
              </span>
              <h2 className="mt-3 text-lg font-bold text-foreground dark:text-foreground-dark">
                {item.itemName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted dark:text-muted-dark">
                {item.description}
              </p>
              <p className="mt-3 text-xs text-muted dark:text-muted-dark">
                {item.location} · {item.contactName} · {item.email}
                {item.whatsapp ? ` · ${item.whatsapp}` : ''}
              </p>
              {item.photoUrl && (
                <a
                  href={item.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-sm font-semibold text-accent"
                >
                  View photo
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => moderate(item, 'approve')}
                disabled={busyId === item.id}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-600 disabled:opacity-50"
              >
                <Check size={17} />
              </button>
              <button
                type="button"
                onClick={() => moderate(item, 'reject')}
                disabled={busyId === item.id}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-600 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
