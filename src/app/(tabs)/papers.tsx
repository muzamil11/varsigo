import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnimatedListItem,
  Button,
  CardSkeletonList,
  Chip,
  Screen,
  SearchBar,
  StateMessage,
} from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { fetchPaperFolders, fetchPapers } from '@/features/papers/api';
import {
  getPaperFileType,
  PAPER_YEARS,
  type Paper,
  type PaperFolder,
  type PaperKind,
} from '@/features/papers/data';
import { PaperCard } from '@/features/papers/PaperCard';
import { useThemeColors } from '@/store/themeStore';

const ALL_DEPARTMENTS: Department = { id: 'all', name: 'All' };
const ALL_FOLDERS: PaperFolder = { id: 'all', name: 'All' };
/** Sentinel for "papers with no folder assigned yet" — never a real
 *  paper_folders.id, so it can share the same selectedFolder state. */
const UNCATEGORIZED_FOLDER: PaperFolder = { id: 'uncategorized', name: 'Uncategorized' };

const KIND_OPTIONS: { value: 'All' | PaperKind; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'past_paper', label: 'Past Paper' },
  { value: 'notes', label: 'Notes' },
];

/** One row in the "browse by subject" list — shows the count up front so a
 *  student never taps into an empty folder to find out. Styled as a plain
 *  list (like a directory), not cards, so it stays compact and scannable
 *  even once there are dozens of subjects. */
function FolderRow({
  icon,
  label,
  count,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between px-4 py-3.5">
      <View className="mr-3 flex-1 flex-row items-center gap-3">
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text
          numberOfLines={1}
          className="flex-1 text-base font-semibold text-foreground dark:text-foreground-dark"
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-sm text-muted dark:text-muted-dark">
          {count} {count === 1 ? 'paper' : 'papers'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function PapersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>(ALL_DEPARTMENTS);
  const [selectedFolder, setSelectedFolder] = useState<PaperFolder>(ALL_FOLDERS);
  const [year, setYear] = useState<(typeof PAPER_YEARS)[number]>('All');
  const [kind, setKind] = useState<'All' | PaperKind>('All');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [folders, setFolders] = useState<PaperFolder[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);
  const hasLoaded = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    const shouldShowSkeleton = !isRefresh && !hasLoaded.current;
    shouldShowSkeleton ? setLoading(true) : setRefreshing(true);
    setError(null);
    try {
      const [departmentList, folderList, paperList] = await Promise.all([
        fetchDepartments(),
        fetchPaperFolders(),
        fetchPapers({
          departmentId: selectedDept.id === 'all' ? undefined : selectedDept.id,
          year: year === 'All' ? undefined : Number(year),
          kind: kind === 'All' ? undefined : kind,
        }),
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
    // Folder filtering happens client-side below (see `filtered`) so the
    // full set stays around to compute each folder's paper count.
  }, [selectedDept.id, year, kind]);

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current);
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (selectedFolder.id === 'uncategorized' && p.folderId !== null) return false;
      if (selectedFolder.id !== 'all' && selectedFolder.id !== 'uncategorized' && p.folderId !== selectedFolder.id) {
        return false;
      }
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q);
    });
  }, [papers, query, selectedFolder.id]);

  /** Paper counts per folder for the "browse by subject" row below — a
   *  student can see what's inside before tapping in. */
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorized = 0;
    for (const p of papers) {
      if (p.folderId) counts.set(p.folderId, (counts.get(p.folderId) ?? 0) + 1);
      else uncategorized += 1;
    }
    return { counts, uncategorized };
  }, [papers]);

  const downloadToCache = async (url: string, title: string, onProgress?: (ratio: number) => void) => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf';
    const safeTitle = title.replace(/[^\w.\-]+/g, '_');
    const destUri = `${FileSystem.cacheDirectory}${safeTitle}-${Date.now()}.${ext}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      destUri,
      {},
      (progress) => {
        const ratio =
          progress.totalBytesExpectedToWrite > 0
            ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
            : 0;
        onProgress?.(ratio);
      },
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error('Download was cancelled.');

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    if (fileInfo.exists && 'size' in fileInfo && fileInfo.size === 0) {
      throw new Error('Downloaded file is empty.');
    }
    return result.uri;
  };

  const openPaper = (paper: Paper) => {
    if (getPaperFileType(paper.fileUrl) === 'image') {
      setPreviewPaper(paper);
      setPreviewIndex(0);
      setPreviewRotation(0);
      return;
    }
    handleDownload(paper);
  };

  const handleDownload = async (paper: Paper) => {
    if (downloadingId) return;

    setDownloadingId(paper.id);
    setDownloadProgress(0);
    try {
      const uri = await downloadToCache(paper.fileUrl, paper.title, setDownloadProgress);
      if (await Sharing.isAvailableAsync()) {
        // For PDFs, shareAsync() is the "open" step: on iOS it hands the
        // file straight to QuickLook, which is effectively opening it.
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${uri}`);
      }
    } catch {
      Alert.alert('Download failed', 'Could not download this file. Please try again.');
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };
  const handleSharePreview = async () => {
    if (!previewPaper) return;
    try {
      const currentUrl = previewPaper.fileUrls[previewIndex] ?? previewPaper.fileUrl;
      const uri = await downloadToCache(currentUrl, `${previewPaper.title}-page-${previewIndex + 1}`);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${uri}`);
      }
    } catch {
      Alert.alert('Download failed', 'Could not save this page. Please try again.');
    }
  };

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
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View className="px-4">
        <View className="mt-3">
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search subject or title…" />
        </View>
      </View>

      {folders.length > 0 &&
        (selectedFolder.id === 'all' ? (
          <View className="mt-3 px-4">
            <Text className="mb-2 text-xs font-semibold text-muted dark:text-muted-dark">
              Browse by subject
            </Text>
            <View className="max-h-72 divide-y divide-line rounded-2xl border border-line bg-card dark:divide-line-dark dark:border-line-dark dark:bg-card-dark">
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {folders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    icon="folder-outline"
                    label={folder.name}
                    count={folderCounts.counts.get(folder.id) ?? 0}
                    onPress={() => setSelectedFolder(folder)}
                  />
                ))}
                {folderCounts.uncategorized > 0 && (
                  <FolderRow
                    icon="folder-open-outline"
                    label="Uncategorized"
                    count={folderCounts.uncategorized}
                    onPress={() => setSelectedFolder(UNCATEGORIZED_FOLDER)}
                  />
                )}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View className="mt-3 flex-row flex-wrap items-center gap-1.5 px-4">
            <Pressable
              onPress={() => setSelectedFolder(ALL_FOLDERS)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="chevron-back" size={16} color={colors.accent} />
              <Text className="text-sm font-semibold text-accent">All subjects</Text>
            </Pressable>
            <Text className="text-muted dark:text-muted-dark">/</Text>
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
              {selectedFolder.name}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark">
              ({filtered.length} {filtered.length === 1 ? 'paper' : 'papers'})
            </Text>
          </View>
        ))}

      <View className="mt-3 px-4">
        <Pressable
          onPress={() => setDepartmentPickerOpen(true)}
          className="flex-row items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
        >
          <View>
            <Text className="text-xs text-muted dark:text-muted-dark">Department</Text>
            <Text className="mt-1 text-sm font-semibold text-foreground dark:text-foreground-dark">
              {selectedDept.name}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <View className="mt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {KIND_OPTIONS.map((k) => (
            <Chip
              key={k.value}
              label={k.label}
              selected={kind === k.value}
              onPress={() => setKind(k.value)}
            />
          ))}
        </ScrollView>
      </View>
      <View className="mt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {PAPER_YEARS.map((y) => (
            <Chip key={y} label={y} selected={year === y} onPress={() => setYear(y)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : error ? (
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load papers"
          subtitle={error}
          onRetry={load}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={refreshing}
          onRefresh={() => load(true)}
          ItemSeparatorComponent={() => <View className="mb-3 h-px bg-line dark:bg-line-dark" />}
          ListHeaderComponent={
            (selectedFolder.id === 'all' || query.trim()) ? (
              <Text className="mb-3 text-sm text-muted dark:text-muted-dark">
                Showing {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
                {query.trim() ? ` matching "${query.trim()}"` : ''}
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <PaperCard
                paper={item}
                onPress={() => openPaper(item)}
                onAskPress={() =>
                  router.push({
                    pathname: '/papers/[id]/questions',
                    params: { id: item.id, title: item.title },
                  })
                }
                downloading={downloadingId === item.id}
                downloadProgress={downloadingId === item.id ? downloadProgress : 0}
              />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <StateMessage
              icon="document-text-outline"
              title="No files found"
              subtitle={
                query || selectedFolder.id !== 'all'
                  ? 'Try a different search term or filter.'
                  : 'Be the first to upload a paper or notes.'
              }
            />
          }
        />
      )}

      <Modal
        visible={previewPaper !== null}
        animationType="slide"
        onRequestClose={() => setPreviewPaper(null)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 pt-2">
            <Text className="text-sm font-semibold text-white">
              {previewPaper
                ? `Page ${previewIndex + 1} of ${previewPaper.fileUrls.length}`
                : ''}
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setPreviewRotation((r) => (r + 90) % 360)}
                hitSlop={8}
                className="h-10 flex-row items-center gap-1.5 rounded-full bg-white/10 px-3"
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text className="text-sm font-medium text-white">Rotate</Text>
              </Pressable>
              <Pressable
                onPress={() => setPreviewPaper(null)}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
          <View className="flex-1 items-center justify-center">
            {previewPaper && (
              <Image
                source={{ uri: previewPaper.fileUrls[previewIndex] ?? previewPaper.fileUrl }}
                style={{ transform: [{ rotate: `${previewRotation}deg` }] }}
                className="h-full w-full"
                resizeMode="contain"
              />
            )}
          </View>
          <View className="px-4 pb-4">
            {previewPaper && previewPaper.fileUrls.length > 1 && (
              <View className="mb-3 flex-row gap-2">
                <Button
                  label="Previous"
                  variant="ghost"
                  onPress={() => {
                    setPreviewIndex((index) => Math.max(0, index - 1));
                    setPreviewRotation(0);
                  }}
                  disabled={previewIndex === 0}
                  className="flex-1 border-white/20"
                />
                <Button
                  label="Next"
                  variant="ghost"
                  onPress={() => {
                    setPreviewIndex((index) =>
                      Math.min((previewPaper?.fileUrls.length ?? 1) - 1, index + 1),
                    );
                    setPreviewRotation(0);
                  }}
                  disabled={previewIndex >= previewPaper.fileUrls.length - 1}
                  className="flex-1 border-white/20"
                />
              </View>
            )}
            <Button label="Save or Share Page" onPress={handleSharePreview} />
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={departmentPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDepartmentPickerOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setDepartmentPickerOpen(false)}
        >
          <Pressable className="max-h-[70%] rounded-t-3xl bg-card p-4 dark:bg-card-dark">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
                Select department
              </Text>
              <Pressable
                onPress={() => setDepartmentPickerOpen(false)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full border border-line dark:border-line-dark"
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={[ALL_DEPARTMENTS, ...departments]}
              keyExtractor={(department) => department.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedDept(item);
                    setDepartmentPickerOpen(false);
                  }}
                  className="flex-row items-center justify-between rounded-xl px-3 py-3"
                >
                  <Text className="text-base text-foreground dark:text-foreground-dark">
                    {item.name}
                  </Text>
                  {selectedDept.id === item.id && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

    </Screen>
  );
}
