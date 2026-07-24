import React from 'react';

interface SkeletonBlockProps {
  className?: string;
}

/** Pulsing placeholder block — compose a few into a per-page skeleton row. */
export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={`animate-pulse rounded-lg bg-line dark:bg-line-dark ${className ?? ''}`} />;
}

/** Placeholder matching TeacherCard/PaperCard's rounded-2xl card layout. */
export function CardSkeleton() {
  return (
    <div className="mb-3 flex flex-row items-center rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
      <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
      <div className="ml-3 flex-1">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="mt-2 h-3 w-1/2" />
      </div>
    </div>
  );
}

interface CardSkeletonListProps {
  count?: number;
  /** Pages with their own padded container should pass false to avoid
   *  doubling the horizontal inset. */
  padded?: boolean;
}

export function CardSkeletonList({ count = 4, padded = true }: CardSkeletonListProps) {
  return (
    <div className={padded ? 'px-4 pt-4' : undefined}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
