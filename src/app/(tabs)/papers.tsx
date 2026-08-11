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
import { fetchPapers } from '@/features/papers/api';
import { getPaperFileType, PAPER_YEARS, type Paper, type PaperKind } from '@/features/papers/data';
import { PaperCard } from '@/features/papers/PaperCard';
import { useThemeColors } from '@/store/themeStore';

const ALL_DEPARTMENTS: Department = { id: 'all', name: 'All' };

const KIND_OPTIONS: { value: 'All' | PaperKind; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'past_paper', label: 'Past Paper' },
  { value: 'notes', label: 'Notes' },
];

export default function PapersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>(ALL_DEPARTMENTS);
  const [year, setYear] = useState<(typeof PAPER_YEARS)[number]>('All');
  const [kind, setKind] = useState<'All' | PaperKind>('All');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);
  const hasLoaded = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    const shouldShowSkeleton = !isRefresh && !hasLoaded.current;
    shouldShowSkeleton ? setLoading(true) : setRefreshing(true);
    setError(null);
    try {
      const [departmentList, paperList] = await Promise.all([
        fetchDepartments(),
        fetchPapers({
          departmentId: selectedDept.id === 'all' ? undefined : selectedDept.id,
          year: year === 'All' ? undefined : Number(year),
          kind: kind === 'All' ? undefined : kind,
        }),
      ]);
      setDepartments(departmentList);
      setPapers(paperList);
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      shouldShowSkeleton ? setLoading(false) : setRefreshing(false);
    }
  }, [selectedDept.id, year, kind]);

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current);
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) => p.title.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q),
    );
  }, [papers, query]);

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
                query
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
            <Pressable
              onPress={() => setPreviewPaper(null)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center">
            {previewPaper && (
              <Image
                source={{ uri: previewPaper.fileUrls[previewIndex] ?? previewPaper.fileUrl }}
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
                  onPress={() => setPreviewIndex((index) => Math.max(0, index - 1))}
                  disabled={previewIndex === 0}
                  className="flex-1 border-white/20"
                />
                <Button
                  label="Next"
                  variant="ghost"
                  onPress={() =>
                    setPreviewIndex((index) =>
                      Math.min((previewPaper?.fileUrls.length ?? 1) - 1, index + 1),
                    )
                  }
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
