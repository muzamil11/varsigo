import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import React, { useEffect } from 'react';

import { ErrorBoundary } from '@/components';
import { useThemeColors, useThemeStore } from '@/store/themeStore';

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const colors = useThemeColors();

  // Keep NativeWind's dark: variants in sync with the persisted theme.
  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);

  return (
    <ErrorBoundary>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ErrorBoundary>
  );
}
