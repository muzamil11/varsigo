import React from 'react';

/** The credited org's glyph — a single bold "N" stroke, deliberately plain
 *  so it reads clearly even at favicon size. Lives on its own (not baked
 *  into OrgBadge) so it can be reused standalone later (e.g. a favicon). */
export function OrgMark({
  size = 24,
  color = 'currentColor',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 18 L6 6 L18 18 L18 6"
        stroke={color}
        strokeWidth={3.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
