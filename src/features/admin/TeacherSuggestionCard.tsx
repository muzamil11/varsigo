import React from 'react';
import { Text, View } from 'react-native';

import { Button, Card } from '@/components';
import type { TeacherSuggestion } from './data';

export function TeacherSuggestionCard({
  suggestion,
  onApprove,
  onReject,
}: {
  suggestion: TeacherSuggestion;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="mb-3">
      <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
        {suggestion.name}
      </Text>
      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
        {[suggestion.departmentName, suggestion.createdAt].filter(Boolean).join(' · ')}
      </Text>
      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
        Suggested by {suggestion.suggestedBy}
      </Text>
      <View className="mt-3 flex-row gap-2">
        <Button label="✅ Approve" onPress={onApprove} className="flex-1" />
        <Button label="❌ Reject" variant="ghost" onPress={onReject} className="flex-1" />
      </View>
    </Card>
  );
}
