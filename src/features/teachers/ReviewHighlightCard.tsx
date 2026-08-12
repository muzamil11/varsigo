import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components';
import type { RecentReview } from './data';

/** A single review shown outside its teacher's own page — see
 *  fetchRecentReviews(). Styled as a testimonial rather than a plain
 *  review row, since it's meant to draw attention on the Home screen. */
export function ReviewHighlightCard({
  review,
  onPress,
}: {
  review: RecentReview;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} className="mr-3 w-72">
      <View className="flex-row items-center justify-between">
        <Ionicons name="chatbox" size={18} color="#6366F1" style={{ opacity: 0.5 }} />
        <View className="flex-row items-center gap-1">
          <Ionicons name="star" size={13} color="#6366F1" />
          <Text className="text-xs font-bold text-accent">{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text
        numberOfLines={3}
        className="mt-2 text-sm italic leading-5 text-foreground dark:text-foreground-dark"
      >
        "{review.comment}"
      </Text>
      <Text numberOfLines={1} className="mt-3 text-xs font-medium text-muted dark:text-muted-dark">
        — {review.author}, on {review.teacherName}
      </Text>
    </Card>
  );
}
