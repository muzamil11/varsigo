import React from 'react';
import { Text, View } from 'react-native';

import { Button, Card } from '@/components';
import { getPaperFileType, PAPER_KIND_LABELS } from '@/features/papers/data';
import type { AdminUpload } from './data';

export function AdminUploadCard({
  upload,
  onApprove,
  onReject,
}: {
  upload: AdminUpload;
  onApprove: () => void;
  onReject: () => void;
}) {
  const fileType = getPaperFileType(upload.fileUrl);
  return (
    <Card className="mb-3">
      <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
        {upload.title}
      </Text>
      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
        {[
          upload.subject,
          upload.department,
          upload.year,
          PAPER_KIND_LABELS[upload.kind],
          fileType === 'image' ? 'Image' : 'PDF',
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <Text className="mt-2 text-xs text-muted dark:text-muted-dark">{upload.createdAt}</Text>
      <View className="mt-3 flex-row gap-2">
        <Button label="✅ Approve" onPress={onApprove} className="flex-1" />
        <Button label="❌ Reject" variant="ghost" onPress={onReject} className="flex-1" />
      </View>
    </Card>
  );
}
