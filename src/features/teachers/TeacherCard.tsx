import React from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components';
import { formatCourse } from '@/features/courses/types';
import type { TeacherListItem } from './data';

function verificationLabel(status: TeacherListItem['verificationStatus']): string {
  switch (status) {
    case 'admin_verified':
      return 'Verified';
    case 'suggestion_approved':
      return 'Approved suggestion';
    case 'unverified':
      return 'Unverified';
  }
}

/** Initials avatar + name/dept + rating badge, tappable to open detail. */
export function TeacherCard({
  teacher,
  onPress,
}: {
  teacher: TeacherListItem;
  onPress: () => void;
}) {
  const initials = teacher.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');

  return (
    <Card onPress={onPress} className="mb-3 flex-row items-center">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/15">
        <Text className="text-base font-semibold text-accent">{initials}</Text>
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row flex-wrap items-center">
          <Text className="mr-2 text-base font-semibold text-foreground dark:text-foreground-dark">
            {teacher.name}
          </Text>
          <View className="rounded-md bg-accent/10 px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-accent">
              {verificationLabel(teacher.verificationStatus)}
            </Text>
          </View>
        </View>
        {teacher.department && (
          <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark">
            {teacher.department}
          </Text>
        )}
        {teacher.courses.length > 0 && (
          <Text
            className="mt-0.5 text-xs text-muted dark:text-muted-dark"
            numberOfLines={2}
          >
            {teacher.courses.map(formatCourse).join(', ')}
          </Text>
        )}
      </View>
      {teacher.rating !== null ? (
        <View className="rounded-lg bg-accent/10 px-2 py-1">
          <Text className="text-sm font-semibold text-accent">⭐ {teacher.rating.toFixed(1)}</Text>
        </View>
      ) : (
        <View className="rounded-lg bg-line px-2 py-1 dark:bg-line-dark">
          <Text className="text-xs font-medium text-muted dark:text-muted-dark">New</Text>
        </View>
      )}
    </Card>
  );
}
