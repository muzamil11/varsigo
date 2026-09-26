import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CardSkeletonList, Screen, StateMessage } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { fetchPaperFolders, fetchPapers } from '@/features/papers/api';
import type { Paper, PaperFolder } from '@/features/papers/data';
import { PaperListSection } from '@/features/papers/PaperListSection';
import { useThemeColors } from '@/store/themeStore';

/** A single subject's papers — reached by tapping a folder card on the
 *  Papers tab. Reuses the exact same search/filter/preview UI as the main
 *  listing (PaperListSection), just handed a folder-scoped set of papers. */
export default function PaperFolderScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [folder, setFolder] = useState<PaperFolder | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [folders, folderPapers, departmentList] = await Promise.all([
        fetchPaperFolders(),
        fetchPapers({ folderId: id }),
        fetchDepartments(),
      ]);
      setFolder(folders.find((f) => f.id === id) ?? null);
      setPapers(folderPapers);
      setDepartments(departmentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-lg font-semibold text-foreground dark:text-foreground-dark"
          >
            {folder?.name ?? 'Subject'}
          </Text>
          {!loading && !error && (
            <Text className="text-xs text-muted dark:text-muted-dark">
              {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : error ? (
        <StateMessage icon="cloud-offline-outline" title="Couldn't load this subject" subtitle={error} onRetry={load} />
      ) : !folder ? (
        <StateMessage
          icon="folder-outline"
          title="Subject not found"
          subtitle="It may have been renamed or removed."
        />
      ) : (
        <PaperListSection
          papers={papers}
          departments={departments}
          searchPlaceholder={`Search in ${folder.name}…`}
          emptyTitle="No papers yet"
          emptySubtitle="Papers assigned to this subject will show here."
        />
      )}
    </Screen>
  );
}
