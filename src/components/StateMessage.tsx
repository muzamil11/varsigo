import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { Button } from './Button';
import { useThemeColors } from '@/store/themeStore';

interface StateMessageProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/** Centered icon + title + subtitle, used for error and empty list states. */
export function StateMessage({ icon, title, subtitle, retryLabel = 'Try again', onRetry }: StateMessageProps) {
  const colors = useThemeColors();
  return (
    <View className="items-center justify-center px-8 py-12">
      <Ionicons name={icon} size={32} color={colors.textMuted} />
      <Text className="mt-3 text-center text-base font-semibold text-foreground dark:text-foreground-dark">
        {title}
      </Text>
      {subtitle && (
        <Text className="mt-1 text-center text-sm text-muted dark:text-muted-dark">
          {subtitle}
        </Text>
      )}
      {onRetry && (
        <Button label={retryLabel} variant="ghost" onPress={onRetry} className="mt-4" />
      )}
    </View>
  );
}
