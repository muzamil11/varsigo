import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, CardSkeletonList, Screen, SearchBar, StateMessage } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { fetchPaperFolders, fetchPapers } from '@/features/papers/api';
import type { Paper, PaperFolder } from '@/features/papers/data';
import { PaperListSection } from '@/features/papers/PaperListSection';
import { useThemeColors } from '@/store/themeStore';

/** One folder in the "browse by subject" list, styled like the paper cards
 *  below it (same icon-box + title + meta-row shape via the shared Card
 *  component) so folders and papers read as one visual system, just
 *  navigating to that folder's own screen instead of opening a file. */
function FolderCard({
  name,
  count,
  department,
  onPress,
}: {
  name: string;
  count: number;
  department: string | null;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
          <Ionicons name="folder-outline" size={20} color="#6366F1" />
        </View>
        <View className="ml-3 flex-1">
          <Text numberOfLines={1} className="text-base font-semibold text-foreground dark:text-foreground-dark">
            {name}
          </Text>
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
            {[department ?? 'General', `${count} ${count === 1 ? 'paper' : 'papers'}`].join(' - ')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

export default function PapersScreen() {
  const router = useRouter();
  const [folderSearch, setFolderSearch] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [folders, setFolders] = useState<PaperFolder[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    const shouldShowSkeleton = !isRefresh && !hasLoaded.current;
    shouldShowSkeleton ? setLoading(true) : setRefreshing(true);
    setError(null);
    try {
      const [departmentList, folderList, paperList] = await Promise.all([
        fetchDepartments(),
        fetchPaperFolders(),
        fetchPapers(),
      ]);
      setDepartments(departmentList);
      setFolders(folderList);
      setPapers(paperList);
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      shouldShowSkeleton ? setLoading(false) : setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current);
    }, [load]),
  );

  /** Per-folder count/department, plus the uncategorized bucket that shows
   *  directly below instead of behind a folder tap. Department is taken
   *  from each folder's first match: folders are subject-specific in
   *  practice, so its papers share one department. */
  const { folderMeta, uncategorizedPapers } = useMemo(() => {
    const meta = new Map<string, { count: number; department: string | null }>();
    const uncategorized: Paper[] = [];
    for (const p of papers) {
      if (!p.folderId) {
        uncategorized.push(p);
        continue;
      }
      const existing = meta.get(p.folderId);
      if (existing) existing.count += 1;
      else meta.set(p.folderId, { count: 1, department: p.department });
    }
    return { folderMeta: meta, uncategorizedPapers: uncategorized };
  }, [papers]);

  const visibleFolders = useMemo(() => {
    const q = folderSearch.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, folderSearch]);

  const folderBrowseHeader = folders.length > 0 && (
    <View className="mb-2">
      <Text className="mb-2 text-xs font-semibold text-muted dark:text-muted-dark">Browse by subject</Text>
      {folders.length > 6 && (
        <View className="mb-3">
          <SearchBar value={folderSearch} onChangeText={setFolderSearch} placeholder="Search subjects…" />
        </View>
      )}
      {visibleFolders.length === 0 ? (
        <StateMessage icon="search-outline" title="No matching subjects" subtitle="Try a different search term." />
      ) : (
        visibleFolders.map((folder) => {
          const meta = folderMeta.get(folder.id);
          return (
            <FolderCard
              key={folder.id}
              name={folder.name}
              count={meta?.count ?? 0}
              department={meta?.department ?? null}
              onPress={() => router.push(`/papers/folder/${folder.id}`)}
            />
          );
        })
      )}
      <Text className="mb-1 mt-1 text-xs font-semibold text-muted dark:text-muted-dark">
        {folders.length > 0 ? 'Uncategorized papers' : 'All papers'}
      </Text>
    </View>
  );

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Past Papers & Notes
        </Text>
        <Pressable
          onPress={() => router.push('/papers/upload')}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-line bg-card dark:border-line-dark dark:bg-card-dark"
        >
          <Ionicons name="add" size={22} color="#6366F1" />
        </Pressable>
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : error ? (
        <StateMessage icon="cloud-offline-outline" title="Couldn't load papers" subtitle={error} onRetry={load} />
      ) : (
        <PaperListSection
          papers={uncategorizedPapers}
          departments={departments}
          listHeader={folderBrowseHeader}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          emptyTitle={folders.length > 0 && uncategorizedPapers.length === 0 ? 'Nothing uncategorized' : 'No files found'}
          emptySubtitle={
            folders.length > 0 && uncategorizedPapers.length === 0
              ? 'Every approved paper is already sorted into a subject above.'
              : 'Be the first to upload a paper or notes.'
          }
        />
      )}
    </Screen>
  );
}
