'use client';

import {
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { Chip, PageShell, SearchBar, StateMessage } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { fetchLostFoundItems, submitLostFoundItem } from './api';
import { LOST_FOUND_KIND_LABELS, type LostFoundInput, type LostFoundItem, type LostFoundKind } from './data';

const EMPTY_INPUT: LostFoundInput = {
  kind: 'lost',
  itemName: '',
  description: '',
  university: 'NED University',
  campus: '',
  location: '',
  contactName: '',
  whatsapp: '',
  email: '',
  photoUrl: '',
};

export function LostFoundPage() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'All' | LostFoundKind>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<LostFoundInput>(EMPTY_INPUT);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    void Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
    });
    fetchLostFoundItems()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load Lost & Found.'))
      .finally(() => setLoading(false));
  }, [hasHydrated, isAuthenticated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== 'All' && item.kind !== kind) return false;
      if (!q) return true;
      return (
        item.itemName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [items, kind, query]);

  const updateForm = (patch: Partial<LostFoundInput>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const startReport = (reportKind: LostFoundKind) => {
    setForm({
      ...EMPTY_INPUT,
      kind: reportKind,
      contactName: user?.name ?? '',
      email: user?.email ?? '',
    });
    setStep(1);
    setSubmitted(false);
    setFormOpen(true);
  };

  const canGoNext =
    step === 1
      ? form.itemName.trim().length >= 2 && form.description.trim().length >= 10
      : step === 2
        ? form.location.trim().length >= 3
        : form.contactName.trim().length >= 2 && form.email.trim().includes('@');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitLostFoundItem(form);
      setSubmitted(true);
      setForm(EMPTY_INPUT);
      setStep(1);
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (hasHydrated && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
          <HelpCircle className="mx-auto text-accent" size={34} />
          <h1 className="mt-4 text-3xl font-bold text-foreground dark:text-foreground-dark">
            Lost &amp; Found
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted dark:text-muted-dark">
            Sign in with Google to report lost or found items and view approved contact details.
          </p>
          <Link
            href="/login?redirect=/lost-found"
            className="mt-6 inline-flex rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white"
          >
            Continue with Google
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <section className="rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line bg-accent/10 px-5 py-7 dark:border-line-dark sm:px-7 lg:px-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Student help desk
              </p>
              <h1 className="text-4xl font-bold text-foreground dark:text-foreground-dark">
                Lost &amp; Found
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted dark:text-muted-dark sm:text-base">
                Report lost or found items with clear details. Submissions appear only after admin
                approval, and contact details are available to signed-in students.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startReport('lost')}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-line px-5 text-sm font-semibold text-foreground dark:border-line-dark dark:text-foreground-dark"
              >
                <Plus size={17} />
                Report lost
              </button>
              <button
                type="button"
                onClick={() => startReport('found')}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white"
              >
                <CheckCircle2 size={17} />
                Report found
              </button>
            </div>
          </div>
        </div>

        {submitted && (
          <div className="m-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-300">
            Submitted for admin approval. It will appear after moderation.
          </div>
        )}
        {error && (
          <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="p-5 sm:p-7 lg:p-9">
          <div className="rounded-2xl border border-line bg-background p-4 dark:border-line-dark dark:bg-background-dark">
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search item or location..." />
            <div className="mt-4 flex flex-wrap">
              <Chip label="All items" selected={kind === 'All'} onPress={() => setKind('All')} />
              <Chip label="Lost" selected={kind === 'lost'} onPress={() => setKind('lost')} />
              <Chip label="Found" selected={kind === 'found'} onPress={() => setKind('found')} />
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <StateMessage icon={Search} title="Loading approved items" />
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
                <StateMessage
                  icon={Search}
                  title="No approved items yet"
                  subtitle="Lost & Found reports appear here after admin approval."
                />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-line bg-card p-5 dark:border-line-dark dark:bg-card-dark"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                          {LOST_FOUND_KIND_LABELS[item.kind]}
                        </span>
                        <h2 className="mt-3 text-lg font-bold text-foreground dark:text-foreground-dark">
                          {item.itemName}
                        </h2>
                      </div>
                      <span className="text-xs text-muted dark:text-muted-dark">{item.createdAt}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted dark:text-muted-dark">
                      {item.description}
                    </p>
                    {item.photoUrl && (
                      <a
                        href={item.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-accent"
                      >
                        View photo
                      </a>
                    )}
                    <div className="mt-4 grid gap-2 text-sm text-muted dark:text-muted-dark">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={15} className="text-accent" />
                        {item.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Mail size={15} className="text-accent" />
                        {item.email}
                      </span>
                      {item.whatsapp && (
                        <span className="inline-flex items-center gap-2">
                          <Phone size={15} className="text-accent" />
                          {item.whatsapp}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl dark:border-line-dark dark:bg-card-dark">
            <div className="border-b border-line p-5 dark:border-line-dark">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    Step {step} of 3
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-foreground dark:text-foreground-dark">
                    {LOST_FOUND_KIND_LABELS[form.kind]}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-full border border-line px-3 py-1.5 text-sm dark:border-line-dark"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((value) => (
                  <div
                    key={value}
                    className={`h-2 rounded-full ${value <= step ? 'bg-accent' : 'bg-line dark:bg-line-dark'}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 p-5">
              {step === 1 && (
                <>
                  <Field label="Item name" value={form.itemName} onChange={(value) => updateForm({ itemName: value })} />
                  <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(value) => updateForm({ description: value })}
                    placeholder="Color, brand, distinguishing marks, contents..."
                  />
                  <Field
                    label="Photo link (optional)"
                    value={form.photoUrl}
                    onChange={(value) => updateForm({ photoUrl: value })}
                    placeholder="https://..."
                  />
                </>
              )}
              {step === 2 && (
                <>
                  <Field label="University" value={form.university} onChange={(value) => updateForm({ university: value })} />
                  <Field label="Campus (optional)" value={form.campus} onChange={(value) => updateForm({ campus: value })} />
                  <Field
                    label="Specific location"
                    value={form.location}
                    onChange={(value) => updateForm({ location: value })}
                    placeholder="e.g. Library, CSIT lab, parking..."
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <Field label="Your name" value={form.contactName} onChange={(value) => updateForm({ contactName: value })} />
                  <Field label="WhatsApp number (optional)" value={form.whatsapp} onChange={(value) => updateForm({ whatsapp: value })} />
                  <Field label="Email" value={form.email} onChange={(value) => updateForm({ email: value })} />
                  <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-muted dark:text-muted-dark">
                    Contact details are only returned through the signed-in Edge Function flow.
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between gap-3 border-t border-line p-5 dark:border-line-dark">
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(1, value - 1))}
                disabled={step === 1 || submitting}
                className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold disabled:opacity-40 dark:border-line-dark"
              >
                Back
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((value) => value + 1)}
                  disabled={!canGoNext}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canGoNext || submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <ClipboardList size={16} />
                  {submitting ? 'Submitting...' : 'Submit for approval'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground dark:text-foreground-dark">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-line bg-background px-4 text-sm text-foreground outline-none focus:border-accent dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground dark:text-foreground-dark">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
      />
    </label>
  );
}
