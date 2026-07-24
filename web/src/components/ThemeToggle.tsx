'use client';

import { Moon, Sun } from 'lucide-react';
import React from 'react';

import { useThemeColors, useThemeStore } from '@/store/themeStore';

/** Sun/moon icon button that flips the app theme. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const colors = useThemeColors();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card dark:border-line-dark dark:bg-card-dark"
    >
      {theme === 'dark' ? (
        <Sun size={18} color={colors.text} />
      ) : (
        <Moon size={18} color={colors.text} />
      )}
    </button>
  );
}
