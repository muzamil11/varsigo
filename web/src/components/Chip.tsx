import React from 'react';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Pill-shaped filter chip; filled with accent when selected. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={
        selected
          ? 'mr-2 shrink-0 rounded-full bg-accent px-4 py-1.5'
          : 'mr-2 shrink-0 rounded-full border border-line bg-card px-4 py-1.5 dark:border-line-dark dark:bg-card-dark'
      }
    >
      <span
        className={
          selected ? 'text-sm font-medium text-white' : 'text-sm text-muted dark:text-muted-dark'
        }
      >
        {label}
      </span>
    </button>
  );
}
