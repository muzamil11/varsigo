import React from 'react';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
}

/** Themed page wrapper every page sits inside. Content fades in on mount so
 *  page-to-page navigation feels less abrupt. */
export function Screen({ children, className }: ScreenProps) {
  return (
    <div className="min-h-full flex-1 bg-background dark:bg-background-dark">
      <div className={`animate-fade-in flex-1 ${className ?? ''}`}>{children}</div>
    </div>
  );
}
