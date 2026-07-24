import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

/** Surface container. Renders as a button (with press feedback + a subtle
 *  scale-down) when onPress is given. */
export function Card({ children, onPress, className, ...rest }: CardProps) {
  const base = `rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark ${className ?? ''}`;

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`${base} block w-full text-left transition-transform duration-150 active:scale-[0.97] active:opacity-80`}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={base} {...rest}>
      {children}
    </div>
  );
}
