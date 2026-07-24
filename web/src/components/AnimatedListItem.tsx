import React from 'react';

const STAGGER_DELAY_MS = 50;

interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
}

/** Slides + fades a list row in on mount, staggered by its index so a
 *  freshly loaded list animates in one row after another. */
export function AnimatedListItem({ children, index = 0 }: AnimatedListItemProps) {
  return (
    <div
      className="animate-slide-fade-in"
      style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
    >
      {children}
    </div>
  );
}
