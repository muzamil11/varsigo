'use client';

import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { Button } from './Button';
import { useThemeColors } from '@/store/themeStore';

interface StateMessageProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/** Centered icon + title + subtitle, used for error and empty list states. */
export function StateMessage({
  icon: Icon,
  title,
  subtitle,
  retryLabel = 'Try again',
  onRetry,
}: StateMessageProps) {
  const colors = useThemeColors();
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12">
      <Icon size={32} color={colors.textMuted} />
      <p className="mt-3 text-center text-base font-semibold text-foreground dark:text-foreground-dark">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-center text-sm text-muted dark:text-muted-dark">{subtitle}</p>
      )}
      {onRetry && (
        <Button label={retryLabel} variant="ghost" onPress={onRetry} className="mt-4" />
      )}
    </div>
  );
}
