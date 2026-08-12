import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip } from '@/components';
import { getPaperFileType, PAPER_KIND_LABELS, type PaperKind } from '@/features/papers/data';
import { useThemeColors } from '@/store/themeStore';
import type { UpdateUploadInput } from './api';
import type { AdminDepartment, AdminUpload } from './data';

const KIND_OPTIONS: { value: PaperKind; label: string }[] = [
  { value: 'past_paper', label: PAPER_KIND_LABELS.past_paper },
  { value: 'notes', label: PAPER_KIND_LABELS.notes },
];

/** One paper card in the admin Uploads screen — used for both the pending
 *  queue and the published list, since both need the same edit form and
 *  inline file preview, and differ only in which action buttons show. */
export function AdminUploadCard({
  upload,
  departments,
  onApprove,
  onReject,
  onDelete,
  onSave,
}: {
  upload: AdminUpload;
  departments: AdminDepartment[];
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onSave: (input: UpdateUploadInput) => Promise<void>;
}) {
  const colors = useThemeColors();
  const fileType = getPaperFileType(upload.fileUrl);
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [title, setTitle] = useState(upload.title);
  const [subject, setSubject] = useState(upload.subject);
  const [departmentId, setDepartmentId] = useState<string | null>(upload.departmentId);
  const [year, setYear] = useState(upload.year?.toString() ?? '');
  const [kind, setKind] = useState<PaperKind>(upload.kind);

  const startEdit = () => {
    setTitle(upload.title);
    setSubject(upload.subject);
    setDepartmentId(upload.departmentId);
    setYear(upload.year?.toString() ?? '');
    setKind(upload.kind);
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ title, subject, departmentId, year: year ? Number(year) : null, kind });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Card className="mb-3">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          className="mb-2 h-11 rounded-lg border border-line bg-background px-3 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Subject"
          placeholderTextColor={colors.textMuted}
          className="mb-2 h-11 rounded-lg border border-line bg-background px-3 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <Chip label="General" selected={departmentId === null} onPress={() => setDepartmentId(null)} />
          {departments.map((d) => (
            <Chip key={d.id} label={d.name} selected={departmentId === d.id} onPress={() => setDepartmentId(d.id)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          {KIND_OPTIONS.map((k) => (
            <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />
          ))}
        </ScrollView>
        <TextInput
          value={year}
          onChangeText={(v) => setYear(v.replace(/[^0-9]/g, ''))}
          placeholder="Year"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          className="mb-2 h-11 w-24 rounded-lg border border-line bg-background px-3 text-sm text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
        {saveError && <Text className="mb-2 text-xs text-red-500">{saveError}</Text>}
        <View className="flex-row gap-2">
          <Button label="Save" onPress={handleSave} loading={saving} className="flex-1" />
          <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} disabled={saving} className="flex-1" />
        </View>
      </Card>
    );
  }

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

      <Pressable onPress={() => setPreviewOpen((v) => !v)} className="mt-3 flex-row items-center gap-1">
        <Ionicons name={previewOpen ? 'eye-off-outline' : 'eye-outline'} size={14} color={colors.accent} />
        <Text className="text-xs font-medium text-accent">
          {previewOpen ? 'Hide preview' : `Preview${upload.fileUrls.length > 1 ? ` (${upload.fileUrls.length} pages)` : ''}`}
        </Text>
      </Pressable>

      {previewOpen && (
        <View className="mt-2">
          {upload.fileUrls.map((url, i) =>
            getPaperFileType(url) === 'image' ? (
              <Image
                key={url}
                source={{ uri: url }}
                resizeMode="contain"
                className="mb-2 h-48 w-full rounded-lg bg-background dark:bg-background-dark"
              />
            ) : (
              <Pressable
                key={url}
                onPress={() => Linking.openURL(url)}
                className="mb-2 flex-row items-center justify-between rounded-lg border border-line bg-background px-3 py-3 dark:border-line-dark dark:bg-background-dark"
              >
                <Text className="text-sm text-foreground dark:text-foreground-dark">
                  PDF - page {i + 1}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.accent} />
              </Pressable>
            ),
          )}
        </View>
      )}

      <View className="mt-3 flex-row gap-2">
        {onApprove && <Button label="✅ Approve" onPress={onApprove} className="flex-1" />}
        <Button label="✏️ Edit" variant="ghost" onPress={startEdit} className="flex-1" />
        {onReject && <Button label="❌ Reject" variant="ghost" onPress={onReject} className="flex-1" />}
        {onDelete && <Button label="🗑️ Delete" variant="ghost" onPress={onDelete} className="flex-1" />}
      </View>
    </Card>
  );
}
