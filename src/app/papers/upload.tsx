import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, Screen } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { suggestImportantLink } from '@/features/links/api';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PAGES,
  MAX_UPLOAD_TOTAL_BYTES,
  uploadPaper,
} from '@/features/papers/api';
import { formatFileSize, type PaperKind } from '@/features/papers/data';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

const KIND_OPTIONS: { value: PaperKind; label: string }[] = [
  { value: 'past_paper', label: 'Past Paper' },
  { value: 'notes', label: 'Notes' },
];

type UploadMode = 'file' | 'link';

const MAX_IMAGE_WIDTH = 1920;
const IMAGE_COMPRESS_QUALITY = 0.7;

type PickedUploadFile = DocumentPicker.DocumentPickerAsset & { size?: number };

async function compressImage(uri: string): Promise<string> {
  const { width } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });

  const actions = width > MAX_IMAGE_WIDTH ? [{ resize: { width: MAX_IMAGE_WIDTH } }] : [];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: IMAGE_COMPRESS_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

export default function UploadPaperScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [mode, setMode] = useState<UploadMode>('file');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [kind, setKind] = useState<PaperKind>('past_paper');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [files, setFiles] = useState<PickedUploadFile[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);

  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png'],
      multiple: true,
    });
    if (result.canceled) return;

    const pickedFiles = result.assets as PickedUploadFile[];
    const hasImage = pickedFiles.some((asset) => asset.mimeType?.startsWith('image/'));

    if (!hasImage) return;
    if (pickedFiles.length > MAX_IMAGE_PAGES) {
      Alert.alert('Too many pages', `Upload up to ${MAX_IMAGE_PAGES} image pages at once.`);
      return;
    }

    const originalTotal = pickedFiles.reduce((sum, asset) => sum + (asset.size ?? 0), 0);
    if (originalTotal > MAX_UPLOAD_TOTAL_BYTES) {
      Alert.alert(
        'Upload is too large',
        `Selected files must be under ${formatFileSize(MAX_UPLOAD_TOTAL_BYTES)} total.`,
      );
      return;
    }

    const oversizedImage = pickedFiles.find((asset) => (asset.size ?? 0) > MAX_IMAGE_BYTES);
    if (oversizedImage) {
      Alert.alert(
        'Image is too large',
        `Each image can be up to ${formatFileSize(MAX_IMAGE_BYTES)} before compression.`,
      );
      return;
    }

    setProcessingFile(true);
    try {
      const compressed = await Promise.all(
        pickedFiles.map(async (picked, index) => {
          const compressedUri = await compressImage(picked.uri);
          return {
            ...picked,
            uri: compressedUri,
            name: `${String(index + 1).padStart(2, '0')}-${picked.name.replace(/\.[^.]+$/, '')}.jpg`,
            mimeType: 'image/jpeg',
          };
        }),
      );
      setFiles(compressed);
    } catch (error) {
      Alert.alert(
        'Could not process image',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setProcessingFile(false);
    }
  };

  const isValid =
    mode === 'file'
      ? title.trim().length > 0 && subject.trim().length > 0 && files.length > 0 && !processingFile
      : title.trim().length > 0 && subject.trim().length > 0 && linkUrl.trim().length > 0;

  const handleSubmit = async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      Alert.alert('Please log in', 'You need to be logged in to upload a file.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    if (mode === 'link') {
      if (!linkUrl.trim()) return;
      setSubmitting(true);
      try {
        await suggestImportantLink({
          userId: user.id,
          title: title.trim(),
          url: linkUrl.trim(),
          subtitle: subject.trim(),
        });
        Alert.alert(
          'Link received',
          'Thanks. Your link is pending moderation and will appear once approved.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } catch (error) {
        Alert.alert('Could not submit link', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (files.length === 0) return;

    setSubmitting(true);
    try {
      await uploadPaper({
        userId: user.id,
        title: title.trim(),
        subject: subject.trim(),
        departmentId,
        year: year.trim() ? Number(year.trim()) : null,
        kind,
        files: files.map((selected) => ({
          uri: selected.uri,
          name: selected.name,
          contentType: selected.mimeType,
          size: selected.size,
        })),
      });
      Alert.alert(
        'Upload received',
        'Thanks. Your file is pending moderation and will appear once approved.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          {mode === 'file' ? 'Upload Paper or Notes' : 'Share a Link'}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="mt-4 flex-row rounded-xl border border-line bg-card p-1 dark:border-line-dark dark:bg-card-dark">
          <Pressable
            onPress={() => setMode('file')}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 ${mode === 'file' ? 'bg-accent' : ''}`}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={16}
              color={mode === 'file' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              className={`text-sm font-semibold ${mode === 'file' ? 'text-white' : 'text-muted dark:text-muted-dark'}`}
            >
              Upload a file
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('link')}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5 ${mode === 'link' ? 'bg-accent' : ''}`}
          >
            <Ionicons
              name="link-outline"
              size={16}
              color={mode === 'link' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              className={`text-sm font-semibold ${mode === 'link' ? 'text-white' : 'text-muted dark:text-muted-dark'}`}
            >
              Share a link
            </Text>
          </Pressable>
        </View>

        <Card className="mt-4">
          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={
              mode === 'file' ? 'e.g. Operating Systems - Final Exam' : 'e.g. Complete ANA Notes'
            }
            placeholderTextColor={colors.textMuted}
            className="mb-4 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />

          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Operating Systems"
            placeholderTextColor={colors.textMuted}
            className={mode === 'file' ? 'mb-4 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark' : 'h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark'}
          />
          {mode === 'link' && (
            <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
              Helps admin sort this link under the right subject.
            </Text>
          )}

          {mode === 'file' && (
            <>
              <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">
                Year (optional)
              </Text>
              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder="e.g. 2025"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                className="h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
              />
            </>
          )}
        </Card>

        {mode === 'link' && (
          <Card className="mt-4">
            <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">Link URL</Text>
            <TextInput
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://drive.google.com/..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
              A Google Drive, Docs, or other link other students can open directly.
            </Text>
          </Card>
        )}

        {mode === 'file' && (
        <Card className="mt-4">
          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">Type</Text>
          <View className="flex-row">
            {KIND_OPTIONS.map((k) => (
              <Chip
                key={k.value}
                label={k.label}
                selected={kind === k.value}
                onPress={() => setKind(k.value)}
              />
            ))}
          </View>

          {departments.length > 0 && (
            <>
              <Text className="mb-2 mt-4 text-sm font-medium text-muted dark:text-muted-dark">
                Department (optional)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chip
                  label="None"
                  selected={departmentId === null}
                  onPress={() => setDepartmentId(null)}
                />
                {departments.map((d) => (
                  <Chip
                    key={d.id}
                    label={d.name}
                    selected={departmentId === d.id}
                    onPress={() => setDepartmentId(d.id)}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </Card>
        )}

        {mode === 'file' && (
        <Card className="mt-4">
          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">
            Image pages
          </Text>
          <Text className="mb-3 text-xs text-muted dark:text-muted-dark">
            Up to {MAX_IMAGE_PAGES} image pages under {formatFileSize(MAX_UPLOAD_TOTAL_BYTES)}{' '}
            total.
          </Text>
          <Pressable
            onPress={handlePickFile}
            disabled={processingFile}
            className="flex-row items-center rounded-xl border border-dashed border-line bg-background px-3 py-3 dark:border-line-dark dark:bg-background-dark"
          >
            <Ionicons
              name={
                processingFile
                  ? 'sync-outline'
                  : files.length > 0
                    ? 'image'
                    : 'cloud-upload-outline'
              }
              size={20}
              color={files.length > 0 ? colors.accent : colors.textMuted}
            />
            <Text
              numberOfLines={1}
              className={`ml-2 flex-1 text-sm ${files.length > 0 ? 'text-foreground dark:text-foreground-dark' : 'text-muted dark:text-muted-dark'}`}
            >
              {processingFile
                ? 'Compressing images...'
                : files.length > 0
                  ? files.length === 1
                    ? files[0].name
                    : `${files.length} image pages selected`
                  : 'Tap to choose image pages'}
            </Text>
          </Pressable>

          {files.length > 1 && (
            <View className="mt-3">
              {files.map((selected, index) => (
                <Text
                  key={`${selected.name}-${index}`}
                  className="text-xs text-muted dark:text-muted-dark"
                >
                  Page {index + 1}: {selected.name}
                </Text>
              ))}
            </View>
          )}
        </Card>
        )}

        <Button
          label={mode === 'file' ? 'Upload' : 'Submit Link'}
          onPress={handleSubmit}
          disabled={!isValid}
          loading={submitting}
          className="mt-6"
        />
      </ScrollView>
    </Screen>
  );
}
