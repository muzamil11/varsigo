import React from 'react';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
  type = 'button',
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled || loading}
      className={`h-12 items-center justify-center rounded-xl px-6 transition-transform duration-150 active:scale-[0.97] active:opacity-80 disabled:cursor-not-allowed flex ${
        isPrimary
          ? disabled
            ? 'bg-accent/40'
            : 'bg-accent'
          : 'border border-line bg-transparent dark:border-line-dark'
      } ${className ?? ''}`}
    >
      <span className="m-auto flex items-center justify-center">
        {loading ? (
          <svg
            className="h-5 w-5 animate-spin text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <span
            className={
              isPrimary
                ? 'text-base font-semibold text-white'
                : 'text-base font-medium text-foreground dark:text-foreground-dark'
            }
          >
            {label}
          </span>
        )}
      </span>
    </button>
  );
}
