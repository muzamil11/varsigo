import React from 'react';
import { Text, View } from 'react-native';

/** Horizontal bar visualizing one rating category out of 5. */
export function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <View className="mb-3">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-sm text-muted dark:text-muted-dark">{label}</Text>
        <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
          {value.toFixed(1)}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <View className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}
