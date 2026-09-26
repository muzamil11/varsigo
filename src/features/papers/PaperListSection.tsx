import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedListItem, Button, Chip, SearchBar, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { getPaperFileType, PAPER_YEARS, type Paper, type PaperKind } from '@/features/papers/data';
import { PaperCard } from '@/features/papers/PaperCard';
import { useThemeColors } from '@/store/themeStore';

const ALL_DEPARTMENTS: Department = { id: 'all', name: 'All' };

const KIND_OPTIONS: { value: 'All' | PaperKind; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'past_paper', label: 'Past Paper' },
  { value: 'notes', label: 'Notes' },
];

interface PaperListSectionProps {
  papers: Paper[];
  departments: Department[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Rendered above the search bar, inside this component's own FlatList
   *  header — e.g. the main Papers tab's "browse by subject" folder cards.
   *  Kept as a header here (rather than a sibling FlatList) so there's only
   *  ever one scrollable list per screen. */
  listHeader?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** The search + filters + card list + preview modal shared by the main
 *  Papers tab (for uncategorized papers) and a single folder's screen (for
 *  its papers) — the two only differ in which `papers` they're handed. */
export function PaperListSection({
  papers,
  departments,
  searchPlaceholder = 'Search subject or title…',
  emptyTitle = 'No files found',
  emptySubtitle = 'Uploaded papers appear here after admin approval.',
  listHeader,
  refreshing = false,
  onRefresh,
}: PaperListSectionProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>(ALL_DEPARTMENTS);
  const [year, setYear] = useState<(typeof PAPER_YEARS)[number]>('All');
  const [kind, setKind] = useState<'All' | PaperKind>('All');
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewRotation, setPreviewRotation] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (selectedDept.id !== 'all' && p.department !== selectedDept.name) return false;
      if (year !== 'All' && p.year !== Number(year)) return false;
      if (kind !== 'All' && p.kind !== kind) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q);
    });
  }, [papers, query, selectedDept, year, kind]);

  const isFiltered = Boolean(query.trim() || selectedDept.id !== 'all' || year !== 'All' || kind !== 'All');

  const downloadToCache = async (url: string, title: string, onProgress?: (ratio: number) => void) => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf';
    const safeTitle = title.replace(/[^\w.\-]+/g, '_');
    const destUri = `${FileSystem.cacheDirectory}${safeTitle}-${Date.now()}.${ext}`;

    const downloadResumable = FileSystem.createDownloadResumable(url, destUri, {}, (progress) => {
      const ratio =
        progress.totalBytesExpectedToWrite > 0
          ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
          : 0;
      onProgress?.(ratio);
    });

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
    <View className="flex-1">
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={refreshing}
        onRefresh={onRefresh}
        ItemSeparatorComponent={() => <View className="mb-3 h-px bg-line dark:bg-line-dark" />}
        ListHeaderComponent={
          <View>
            {listHeader}
            <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />

            <View className="mt-3">
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

            <View className="-mx-4 mt-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                {KIND_OPTIONS.map((k) => (
                  <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />
                ))}
              </ScrollView>
            </View>
            <View className="-mx-4 mt-2">
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

            <Text className="mb-3 mt-4 text-sm text-muted dark:text-muted-dark">
              Showing {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
              {query.trim() ? ` matching "${query.trim()}"` : ''}
            </Text>
          </View>
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
            title={emptyTitle}
            subtitle={isFiltered ? 'Try a different search term or filter.' : emptySubtitle}
          />
        }
      />

      <Modal visible={previewPaper !== null} animationType="slide" onRequestClose={() => setPreviewPaper(null)}>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 pt-2">
            <Text className="text-sm font-semibold text-white">
              {previewPaper ? `Page ${previewIndex + 1} of ${previewPaper.fileUrls.length}` : ''}
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
                    setPreviewIndex((index) => Math.min((previewPaper?.fileUrls.length ?? 1) - 1, index + 1));
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
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setDepartmentPickerOpen(false)}>
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
                  <Text className="text-base text-foreground dark:text-foreground-dark">{item.name}</Text>
                  {selectedDept.id === item.id && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
