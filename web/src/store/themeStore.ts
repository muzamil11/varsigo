'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { palette, type ThemeColors, type ThemeName } from '@/theme/colors';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

function applyThemeClass(theme: ThemeName) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
      toggleTheme: () => {
        get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: 'varsigo-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        applyThemeClass(state?.theme ?? 'dark');
      },
    },
  ),
);

/** Raw color values for the active theme — for props that need real color
 *  strings (icon fills, chart colors) instead of classNames. */
export function useThemeColors(): ThemeColors {
  const theme = useThemeStore((s) => s.theme);
  return palette[theme];
}
