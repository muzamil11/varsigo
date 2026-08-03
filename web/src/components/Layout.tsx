import React from 'react';

export const APP_CONTAINER_CLASS = 'mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8';

export function PageShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${APP_CONTAINER_CLASS} py-8 ${className}`}>{children}</div>;
}
