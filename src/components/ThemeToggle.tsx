import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

import { useThemeColors, useThemeStore } from '@/store/themeStore';

/** Sun/moon icon button that flips the app theme. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={toggleTheme}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full border border-line bg-card dark:border-line-dark dark:bg-card-dark"
    >
      <Ionicons
        name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
        size={18}
        color={colors.text}
      />
    </Pressable>
  );
}
