import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components';
import { useThemeColors } from '@/store/themeStore';
import { formatFileSize, getPaperFileType, PAPER_KIND_LABELS, type Paper } from './data';

export function PaperCard({
  paper,
  onPress,
  downloading = false,
  downloadProgress = 0,
}: {
  paper: Paper;
  onPress: () => void;
  downloading?: boolean;
  downloadProgress?: number;
}) {
  const colors = useThemeColors();
  const fileType = getPaperFileType(paper.fileUrl);
  const pageCount = paper.fileUrls.length;
  const [fileSize, setFileSize] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(paper.fileUrl, { method: 'HEAD' })
      .then((res) => {
        const length = res.headers.get('content-length');
        if (!cancelled && length) setFileSize(formatFileSize(Number(length)));
      })
      .catch(() => {
        // File size is a nice-to-have on the card.
      });
    return () => {
      cancelled = true;
    };
  }, [paper.fileUrl]);

  return (
    <Card onPress={onPress} className="mb-3 flex-row items-center">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
        <Ionicons
          name={fileType === 'image' ? 'image-outline' : 'document-text-outline'}
          size={20}
          color="#6366F1"
        />
      </View>
      <View className="ml-3 flex-1">
        <Text
          numberOfLines={1}
          className="text-base font-semibold text-foreground dark:text-foreground-dark"
        >
          {paper.title}
        </Text>
        <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
          {[
            paper.department,
            paper.year,
            PAPER_KIND_LABELS[paper.kind],
            fileType === 'image' && pageCount > 1 ? `${pageCount} pages` : null,
            fileSize,
          ]
            .filter(Boolean)
            .join(' - ')}
        </Text>
        <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
          Uploaded by {paper.uploaderName}
        </Text>
      </View>
      {downloading ? (
        <Text className="text-xs font-medium text-accent">{Math.round(downloadProgress * 100)}%</Text>
      ) : (
        <Ionicons
          name={fileType === 'image' ? 'eye-outline' : 'download-outline'}
          size={20}
          color={colors.textMuted}
        />
      )}
    </Card>
  );
}
