import React from 'react';
import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Pill-shaped filter chip; filled with accent when selected. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={
        selected
          ? 'mr-2 rounded-full bg-accent px-4 py-1.5'
          : 'mr-2 rounded-full border border-line bg-card px-4 py-1.5 dark:border-line-dark dark:bg-card-dark'
      }
    >
      <Text
        className={
          selected
            ? 'text-sm font-medium text-white'
            : 'text-sm text-muted dark:text-muted-dark'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
