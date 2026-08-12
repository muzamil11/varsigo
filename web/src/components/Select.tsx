'use client';

import { ChevronDown } from 'lucide-react';
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** For selects sized to sit inline (e.g. a compact row) rather than the default. */
  chevronSize?: number;
  /** Classes for the wrapping <div> — e.g. `flex-1` when the select needs
   *  to grow inside a flex row, since that has to live on the wrapper, not
   *  the <select> itself. */
  containerClassName?: string;
}

/** A bare <select> renders with the OS's own arrow and box chrome, which
 *  looks jarringly basic next to the rest of the app's styled controls.
 *  This wraps it with appearance:none and a custom chevron so it matches —
 *  callers still control size/color/spacing entirely via className, same
 *  as a plain <select> would. */
export function Select({ className, containerClassName, style, chevronSize = 16, ...rest }: SelectProps) {
  return (
    <div className={`relative ${containerClassName ?? ''}`}>
      <select
        {...rest}
        className={`w-full appearance-none outline-none ${className ?? ''}`}
        // Inline style (not a pr-* class) so this always wins over whatever
        // padding utility the caller's className already has, regardless of
        // Tailwind's class-order-dependent cascade — the chevron needs this
        // room no matter what.
        style={{ paddingRight: '2.25rem', ...style }}
      />
      <ChevronDown
        size={chevronSize}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark"
      />
    </div>
  );
}
