import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components';
import { useThemeColors } from '@/store/themeStore';
import type { QuestionListItem } from './data';

export function QuestionCard({
  question,
  onPress,
}: {
  question: QuestionListItem;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-start justify-between">
        <Text className="mr-3 flex-1 text-base font-semibold text-foreground dark:text-foreground-dark">
          {question.title}
        </Text>
        {question.acceptedAnswerId && (
          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
        )}
      </View>
      {question.body && (
        <Text numberOfLines={2} className="mt-2 text-sm leading-5 text-muted dark:text-muted-dark">
          {question.body}
        </Text>
      )}
      {question.teacherName && (
        <View className="mt-2 self-start rounded-md bg-accent/10 px-2 py-1">
          <Text className="text-xs font-medium text-accent">About {question.teacherName}</Text>
        </View>
      )}
      <View className="mt-3 flex-row flex-wrap items-center">
        <Text className="mr-3 text-xs text-muted dark:text-muted-dark">
          {question.department ?? 'General'}
        </Text>
        <Text className="mr-3 text-xs text-muted dark:text-muted-dark">
          {question.answerCount} answer{question.answerCount === 1 ? '' : 's'}
        </Text>
        <Text className="mr-3 text-xs text-muted dark:text-muted-dark">
          {question.upvoteCount} helpful{question.votedByMe ? ' - you' : ''}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {question.createdAt}
        </Text>
      </View>
    </Card>
  );
}
