import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, Screen } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PAGES,
  MAX_PDF_BYTES,
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

  const [departments, setDepartments] = useState<Department[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [kind, setKind] = useState<PaperKind>('past_paper');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [files, setFiles] = useState<PickedUploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);

  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      multiple: true,
    });
    if (result.canceled) return;

    const pickedFiles = result.assets as PickedUploadFile[];
    const hasPdf = pickedFiles.some((asset) => asset.mimeType === 'application/pdf');
    const hasImage = pickedFiles.some((asset) => asset.mimeType?.startsWith('image/'));

    if (hasPdf && pickedFiles.length > 1) {
      Alert.alert('Choose one type', 'Upload either one PDF or up to 10 image pages.');
      return;
    }

    if (hasPdf) {
      const picked = pickedFiles[0];
      if ((picked.size ?? 0) > MAX_PDF_BYTES) {
        Alert.alert('PDF is too large', `PDF uploads can be up to ${formatFileSize(MAX_PDF_BYTES)}.`);
        return;
      }
      setFiles([picked]);
      return;
    }

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
    title.trim().length > 0 && subject.trim().length > 0 && files.length > 0 && !processingFile;

  const handleSubmit = async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      Alert.alert('Please log in', 'You need to be logged in to upload a file.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
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
        files: files.map((selected) => ({ uri: selected.uri, name: selected.name })),
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
          Upload Paper or Notes
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card className="mt-4">
          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Operating Systems - Final Exam"
            placeholderTextColor={colors.textMuted}
            className="mb-4 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />

          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Operating Systems"
            placeholderTextColor={colors.textMuted}
            className="mb-4 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />

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
        </Card>

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

        <Card className="mt-4">
          <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">
            PDF or image pages
          </Text>
          <Text className="mb-3 text-xs text-muted dark:text-muted-dark">
            One PDF up to {formatFileSize(MAX_PDF_BYTES)}, or up to {MAX_IMAGE_PAGES} image
            pages under {formatFileSize(MAX_UPLOAD_TOTAL_BYTES)} total.
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
                    ? files[0].mimeType?.startsWith('image/')
                      ? 'image'
                      : 'document-text'
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
                  : 'Tap to choose a PDF or image pages'}
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

        <Button
          label="Upload"
          onPress={handleSubmit}
          disabled={!isValid}
          loading={submitting}
          className="mt-6"
        />
      </ScrollView>
    </Screen>
  );
}
