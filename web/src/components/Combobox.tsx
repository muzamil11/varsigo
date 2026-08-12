'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Shows a search box inside the panel once there are enough options to
   *  be worth filtering. Defaults to true; pass false to always hide it. */
  searchable?: boolean;
  searchThreshold?: number;
  /** Trigger button styling — same role className plays on a plain <select>. */
  className?: string;
  /** Classes for the wrapping <div> — e.g. `flex-1` inside a flex row. */
  containerClassName?: string;
  disabled?: boolean;
  id?: string;
}

/** A fully custom dropdown — not a native <select>. The closed trigger can
 *  be styled all we want, but a native <select>'s open option list is
 *  rendered by the OS and can't be restyled at all; this replaces it with
 *  an app-themed panel (plus an optional search filter for longer lists). */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = true,
  searchThreshold = 6,
  className,
  containerClassName,
  disabled,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const showSearch = searchable && options.length > searchThreshold;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && showSearch) {
      searchRef.current?.focus();
    } else if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional, resets the filter once the panel is actually gone
      setQuery('');
    }
  }, [open, showSearch]);

  return (
    <div ref={containerRef} className={`relative ${containerClassName ?? ''}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
      >
        <span
          className={`truncate ${selected ? '' : 'text-muted dark:text-muted-dark'}`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform duration-150 dark:text-muted-dark ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full min-w-[180px] overflow-hidden rounded-xl border border-line bg-card shadow-lg dark:border-line-dark dark:bg-card-dark"
        >
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-line px-3 py-2 dark:border-line-dark">
              <Search size={14} className="shrink-0 text-muted dark:text-muted-dark" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-sm text-foreground outline-none dark:text-foreground-dark"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted dark:text-muted-dark">No matches</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    option.value === value
                      ? 'bg-accent/10 text-accent'
                      : 'text-foreground hover:bg-line/50 dark:text-foreground-dark dark:hover:bg-line-dark/50'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <Check size={14} className="shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
