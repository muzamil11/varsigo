'use client';

import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, StateMessage } from '@/components';
import {
  addImportantLink,
  approveImportantLink,
  deleteImportantLink,
  fetchImportantLinks,
  fetchPendingImportantLinks,
} from '@/features/links/api';
import type { ImportantLink, PendingImportantLink } from '@/features/links/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminLinksPage() {
  const user = useAuthStore((s) => s.user);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [pending, setPending] = useState<PendingImportantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    Promise.all([fetchImportantLinks(), fetchPendingImportantLinks(user.email)])
      .then(([approved, pendingRows]) => {
        setLinks(approved);
        setPending(pendingRows);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);

  const isValid = title.trim().length > 0 && url.trim().length > 0;

  const handleAdd = async () => {
    if (!user?.email || !isValid) return;
    setAdding(true);
    setError(null);
    try {
      await addImportantLink({
        adminEmail: user.email,
        title: title.trim(),
        url: url.trim(),
        subtitle: subtitle.trim() || undefined,
      });
      setTitle('');
      setUrl('');
      setSubtitle('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add link.');
    } finally {
      setAdding(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!user?.email) return;
    setPending((prev) => prev.filter((l) => l.id !== id));
    try {
      await approveImportantLink(user.email, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve link.');
      load();
    }
  };

  const handleReject = async (id: string) => {
    if (!user?.email) return;
    const previous = pending;
    setPending((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteImportantLink(user.email, id);
    } catch (err) {
      setPending(previous);
      setError(err instanceof Error ? err.message : 'Could not reject link.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) return;
    const previous = links;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteImportantLink(user.email, id);
    } catch (err) {
      setLinks(previous);
      setError(err instanceof Error ? err.message : 'Could not delete link.');
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Past Papers Drive)"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle (optional)"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
      </div>
      <Button label="Add link" onPress={handleAdd} loading={adding} disabled={!isValid} className="mb-6" />

      {error && (
        <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
          {error}
        </p>
      )}

      {loading ? (
        <CardSkeletonList padded={false} />
      ) : (
        <>
          <h2 className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
            Pending suggestions {pending.length > 0 ? `(${pending.length})` : ''}
          </h2>
          {pending.length === 0 ? (
            <StateMessage icon={CheckCircle2} title="No pending suggestions" />
          ) : (
            <div className="mb-6 space-y-2">
              {pending.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground dark:text-foreground-dark">
                      {link.title}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-accent hover:underline"
                    >
                      {link.url}
                    </a>
                    <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                      Suggested by {link.submittedBy} · {link.createdAt}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button label="Approve" onPress={() => handleApprove(link.id)} className="h-9 px-3" />
                    <Button
                      label="Reject"
                      variant="ghost"
                      onPress={() => handleReject(link.id)}
                      className="h-9 px-3"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
            Existing links
          </h2>
          {links.length === 0 ? (
            <StateMessage icon={AlertTriangle} title="No links yet" />
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground dark:text-foreground-dark">
                    {link.title}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-accent hover:underline"
                  >
                    {link.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
