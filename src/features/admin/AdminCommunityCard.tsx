import React from 'react';
import { Text, View } from 'react-native';

import { Button, Card } from '@/components';
import type { AdminCommunityReport } from './data';

export function AdminCommunityCard({
  report,
  onDismiss,
  onHide,
}: {
  report: AdminCommunityReport;
  onDismiss: () => void;
  onHide: () => void;
}) {
  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-accent">{report.kind}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark">{report.createdAt}</Text>
      </View>
      <Text className="mt-2 text-base font-semibold text-foreground dark:text-foreground-dark">
        {report.title}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-muted dark:text-muted-dark">
        {report.body}
      </Text>
      <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
        {report.reportedCount} report{report.reportedCount === 1 ? '' : 's'} - Priority{' '}
        {report.moderationPriority}
      </Text>
      <View className="mt-3 flex-row gap-2">
        <Button label="Dismiss" variant="ghost" onPress={onDismiss} className="flex-1" />
        <Button label="Hide" onPress={onHide} className="flex-1" />
      </View>
    </Card>
  );
}
