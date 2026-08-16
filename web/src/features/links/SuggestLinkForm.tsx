'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { suggestImportantLink } from './api';

export function SuggestLinkForm() {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!hasHydrated) return null;

  const isValid = title.trim().length > 0 && url.trim().length > 0;

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await suggestImportantLink({
        userId: user.id,
        title: title.trim(),
        url: url.trim(),
        subtitle: subtitle.trim() || undefined,
      });
      setTitle('');
      setUrl('');
      setSubtitle('');
      setSubmitted(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit link.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
      >
        <Plus size={16} />
        Sign in to suggest a link
      </Link>
    );
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setSubmitted(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Suggest a link
        </button>
        {submitted && (
          <p className="mt-2 text-sm text-muted dark:text-muted-dark">
            Thanks! Your link has been sent for review.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-line bg-card p-5 dark:border-line-dark dark:bg-card-dark">
      <p className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
        Suggest a link
      </p>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. CS Batch 2026 WhatsApp Group)"
          className="h-11 rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark sm:col-span-2"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle (optional)"
          className="h-11 rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="mb-3 h-11 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
      />
      <p className="mb-3 text-xs text-muted dark:text-muted-dark">
        Your link is sent for admin review before it appears for everyone.
      </p>
      {error && (
        <p className="mb-3 rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button label="Submit for review" onPress={handleSubmit} loading={submitting} disabled={!isValid} />
        <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} />
      </div>
    </div>
  );
}
