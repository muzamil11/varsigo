import React from 'react';
import { Text, View } from 'react-native';

import { Button, Card } from '@/components';
import type { AdminReview } from './data';

const QUALITY_LABELS: Record<string, string> = {
  mostly_caps: 'Mostly caps',
  possible_abuse: 'Possible abuse',
  repeated_characters: 'Repeated text',
  thin_comment: 'Thin comment',
};

export function AdminReviewCard({
  review,
  onApprove,
  onReject,
}: {
  review: AdminReview;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="mb-3">
      <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
        {review.teacherName}
      </Text>
      {review.courseName && (
        <Text className="mt-1 text-xs font-medium text-accent">{review.courseName}</Text>
      )}
      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
        Teaching {review.teachingScore} · Grading {review.gradingScore} · Attendance leniency{' '}
        {review.attendanceScore} · Helpfulness {review.helpfulnessScore}
      </Text>
      {review.comment && (
        <Text className="mt-2 text-sm text-foreground dark:text-foreground-dark">
          {review.comment}
        </Text>
      )}
      {(review.reported || review.moderationPriority > 0 || review.qualityFlags.length > 0) && (
        <View className="mt-3 flex-row flex-wrap">
          {review.reported && (
            <View className="mb-2 mr-2 rounded-md bg-red-500/10 px-2 py-1">
              <Text className="text-xs font-semibold text-red-600 dark:text-red-400">Reported</Text>
            </View>
          )}
          {review.moderationPriority > 0 && (
            <View className="mb-2 mr-2 rounded-md bg-accent/10 px-2 py-1">
              <Text className="text-xs font-semibold text-accent">
                Priority {review.moderationPriority}
              </Text>
            </View>
          )}
          {review.qualityFlags.map((flag) => (
            <View key={flag} className="mb-2 mr-2 rounded-md bg-line px-2 py-1 dark:bg-line-dark">
              <Text className="text-xs font-medium text-muted dark:text-muted-dark">
                {QUALITY_LABELS[flag] ?? flag}
              </Text>
            </View>
          ))}
        </View>
      )}
      <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
        Submitted by {review.submittedBy} · {review.createdAt}
      </Text>
      <View className="mt-3 flex-row gap-2">
        <Button label="✅ Approve" onPress={onApprove} className="flex-1" />
        <Button label="❌ Reject" variant="ghost" onPress={onReject} className="flex-1" />
      </View>
    </Card>
  );
}
