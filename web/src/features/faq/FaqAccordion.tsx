'use client';

import { ChevronDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Chip, SearchBar } from '@/components';
import { FAQS, FAQ_CATEGORIES } from './data';

export function FaqAccordion() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof FAQ_CATEGORIES)[number]>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQS.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (!q) return true;
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    });
  }, [search, category]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-foreground dark:text-foreground-dark">
        Frequently Asked Questions
      </h1>
      <p className="mb-4 text-sm text-muted dark:text-muted-dark">
        Common questions about NED University — admissions, CGPA, fees, and more.
      </p>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search questions…" />

      <div className="mt-3 flex flex-wrap">
        {FAQ_CATEGORIES.map((cat) => (
          <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
        ))}
      </div>

      <div className="mt-4 divide-y divide-line dark:divide-line-dark">
        {filtered.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="py-3">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                  {item.question}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-muted transition-transform dark:text-muted-dark ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="mt-2 text-sm leading-6 text-muted dark:text-muted-dark">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
