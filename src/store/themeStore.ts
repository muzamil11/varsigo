import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { palette, type ThemeColors, type ThemeName } from '@/theme';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        colorScheme.set(theme);
        set({ theme });
      },
      toggleTheme: () => {
        get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: 'campuslens-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        colorScheme.set(state?.theme ?? 'dark');
      },
    },
  ),
);

/** Raw color values for the active theme — for props that need real color
 *  strings (tab bar tint, icon color, slider tracks) instead of classNames. */
export function useThemeColors(): ThemeColors {
  const theme = useThemeStore((s) => s.theme);
  return palette[theme];
}
