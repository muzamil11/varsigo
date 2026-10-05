import React from 'react';

import { ORGANIZATION } from '@/lib/organization';
import { OrgMark } from './OrgMark';

/** The gradient chip that houses OrgMark — the only piece that carries the
 *  org's brand color; text around it always stays in the app's own
 *  foreground/muted tokens so it never competes with NEDHub's own accent. */
function OrgMarkChip({ size }: { size: number }) {
  const radius = Math.round(size * 0.29);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.35), transparent 60%), linear-gradient(135deg, ${ORGANIZATION.gradientFrom} 0%, ${ORGANIZATION.gradientTo} 100%)`,
      }}
      className="flex shrink-0 items-center justify-center"
    >
      <OrgMark size={Math.round(size * 0.48)} color="#FFFFFF" />
    </div>
  );
}

/** Credits ORGANIZATION (see src/lib/organization.ts) wherever NEDHub wants
 *  to show it's built for that community — Home hero (`full`) and Footer
 *  (`compact`). Swapping the org for a different campus later only means
 *  editing organization.ts; nothing here is hardcoded. */
export function OrgBadge({
  variant = 'compact',
  className = '',
}: {
  variant?: 'full' | 'compact';
  className?: string;
}) {
  if (variant === 'full') {
    return (
      <div
        className={`inline-flex items-center gap-3 rounded-2xl border border-accent/15 bg-card px-[18px] py-2.5 shadow-[0_8px_24px_-10px_rgba(99,102,241,0.45)] dark:border-accent/30 dark:bg-card-dark ${className}`}
      >
        <OrgMarkChip size={38} />
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted dark:text-muted-dark">
            {ORGANIZATION.tagline}
          </p>
          <p className="text-[14.5px] font-extrabold tracking-tight text-foreground dark:text-foreground-dark">
            {ORGANIZATION.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <OrgMarkChip size={22} />
      <span className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-300">
        {ORGANIZATION.name}
      </span>
    </span>
  );
}
