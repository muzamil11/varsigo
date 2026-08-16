'use client';

import { ChevronDown, FileQuestion, HelpCircle, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Chip, PageShell, SearchBar, StateMessage } from '@/components';
import { FAQS, FAQ_CATEGORIES } from './data';

export function FaqAccordion() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof FAQ_CATEGORIES)[number]>('All');
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQS.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (!q) return true;
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    });
  }, [search, category]);

  const categoryCounts = useMemo(
    () =>
      FAQ_CATEGORIES.map((cat) => ({
        label: cat,
        count: cat === 'All' ? FAQS.length : FAQS.filter((item) => item.category === cat).length,
      })),
    [],
  );

  return (
    <PageShell>
      <div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
          <HelpCircle size={16} />
          Help Center & FAQ
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted dark:text-muted-dark">
          Quick answers about admissions, exams, academic documents, fees, and NEDHub account
          behavior.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {categoryCounts.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setCategory(item.label)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              category === item.label
                ? 'border-accent bg-accent/10'
                : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
            }`}
          >
            <p className="text-xl font-bold text-foreground dark:text-foreground-dark">
              {item.count}
            </p>
            <p className="mt-1 text-xs font-medium text-muted dark:text-muted-dark">{item.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search questions..." />

        <div className="mt-4 flex flex-wrap">
          {FAQ_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-line bg-card p-8 text-center dark:border-line-dark dark:bg-card-dark">
              <StateMessage
                icon={Search}
                title="No FAQ found"
                subtitle="Try a different search or category."
              />
            </div>
          ) : (
            filtered.map((item, index) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    isOpen
                      ? 'border-accent/50 bg-accent/10'
                      : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-bold text-foreground dark:bg-background-dark dark:text-foreground-dark">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-foreground dark:text-foreground-dark sm:text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform dark:text-muted-dark ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-line px-5 py-4 dark:border-line-dark">
                      <div className="flex gap-3">
                        <FileQuestion size={18} className="mt-0.5 shrink-0 text-accent" />
                        <p className="text-sm leading-7 text-muted dark:text-muted-dark">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageShell>
  );
}
