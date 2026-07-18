import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { useThemeColors } from '@/store/themeStore';
import type { AdminTeacher } from './data';

function verificationLabel(status: AdminTeacher['verificationStatus']): string {
  switch (status) {
    case 'admin_verified':
      return 'Verified';
    case 'suggestion_approved':
      return 'Suggestion approved';
    case 'unverified':
      return 'Unverified';
  }
}

export function AdminTeacherRow({
  teacher,
  onDelete,
}: {
  teacher: AdminTeacher;
  onDelete: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Card className="mb-3 flex-row items-center">
      <View className="flex-1">
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
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
            {teacher.department}
          </Text>
        )}
        {teacher.courses.length > 0 && (
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
            {teacher.courses.map(formatCourse).join(', ')}
          </Text>
        )}
      </View>
      <Pressable onPress={onDelete} hitSlop={8} className="p-2">
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </Card>
  );
}
