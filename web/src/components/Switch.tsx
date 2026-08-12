'use client';

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/** iOS-style toggle pill — used instead of a bare <input type="checkbox">,
 *  which renders as the OS's own tiny checkbox and looks out of place next
 *  to the rest of the app's styled controls. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 overflow-hidden rounded-full border-0 p-0 transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-line dark:bg-line-dark'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}
