import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, CardSkeletonList, Chip, StateMessage } from '@/components';
import { fetchPaperFolders } from '@/features/papers/api';
import type { PaperFolder } from '@/features/papers/data';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';
import {
  addImportantLink,
  approveImportantLink,
  deleteImportantLink,
  fetchAllImportantLinks,
  fetchPendingImportantLinks,
  updateImportantLinkFolder,
} from './api';
import type { ImportantLink, PendingImportantLink } from './data';

/** Small "General / <folder>..." chip row used on both the Add-Link form
 *  and every link card so admin can assign/reassign which subject folder a
 *  link belongs to — same two-step pattern as uploads.folder_id. */
function FolderPicker({
  folders,
  folderId,
  onChange,
}: {
  folders: PaperFolder[];
  folderId: string | null;
  onChange: (folderId: string | null) => void;
}) {
  if (folders.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Chip label="General" selected={folderId === null} onPress={() => onChange(null)} />
      {folders.map((f) => (
        <Chip key={f.id} label={f.name} selected={folderId === f.id} onPress={() => onChange(f.id)} />
      ))}
    </ScrollView>
  );
}

/** Self-contained admin CRUD for the Home screen's "Important Links"
 *  section — fetches and manages its own state rather than threading
 *  through admin.tsx's already-large load()/state setup, since this
 *  section has no dependency on the rest of the admin data. */
export function AdminLinksPanel() {
  const colors = useThemeColors();
  const adminEmail = useAuthStore((s) => s.user?.email);

  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [pending, setPending] = useState<PendingImportantLink[]>([]);
  const [folders, setFolders] = useState<PaperFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [newFolderId, setNewFolderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!adminEmail) return;
    setLoading(true);
    setError(null);
    try {
      const [approved, pendingRows, folderList] = await Promise.all([
        fetchAllImportantLinks(adminEmail),
        fetchPendingImportantLinks(adminEmail),
        fetchPaperFolders(),
      ]);
      setLinks(approved);
      setPending(pendingRows);
      setFolders(folderList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    load();
  }, [load]);

  const isValid = title.trim().length > 0 && url.trim().length > 0;

  const handleAdd = async () => {
    if (!adminEmail || !isValid) return;
    setSubmitting(true);
    try {
      await addImportantLink({
        adminEmail,
        title: title.trim(),
        url: url.trim(),
        subtitle: subtitle.trim() || undefined,
        folderId: newFolderId,
      });
      setTitle('');
      setUrl('');
      setSubtitle('');
      setNewFolderId(null);
      await load();
    } catch (err) {
      Alert.alert('Could not add link', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignFolder = async (linkId: string, folderId: string | null) => {
    if (!adminEmail) return;
    try {
      await updateImportantLinkFolder(adminEmail, linkId, folderId);
      await load();
    } catch (err) {
      Alert.alert(
        'Could not update folder',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Please check your internet connection and try again.'),
    );
  };

  const handleApprove = async (link: PendingImportantLink) => {
    if (!adminEmail) return;
    setPending((prev) => prev.filter((l) => l.id !== link.id));
    try {
      await approveImportantLink(adminEmail, link.id);
      await load();
    } catch (err) {
      Alert.alert('Could not approve link', err instanceof Error ? err.message : 'Please try again.');
      await load();
    }
  };

  const handleReject = (link: PendingImportantLink) => {
    Alert.alert('Reject suggestion?', `This removes "${link.title}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          if (!adminEmail) return;
          const previous = pending;
          setPending((prev) => prev.filter((l) => l.id !== link.id));
          try {
            await deleteImportantLink(adminEmail, link.id);
          } catch (err) {
            setPending(previous);
            Alert.alert('Could not reject link', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleDelete = (link: ImportantLink) => {
    Alert.alert('Delete link?', `This removes "${link.title}" from Important Links.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!adminEmail) return;
          const previous = links;
          setLinks((prev) => prev.filter((l) => l.id !== link.id));
          try {
            await deleteImportantLink(adminEmail, link.id);
          } catch (err) {
            setLinks(previous);
            Alert.alert('Could not delete link', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) return <CardSkeletonList />;
  if (error) {
    return (
      <StateMessage icon="cloud-offline-outline" title="Couldn't load links" subtitle={error} onRetry={load} />
    );
  }

  return (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}>
      <Card className="mb-4">
        <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
          Add Link
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (e.g. Past Papers Drive)"
          placeholderTextColor={colors.textMuted}
          className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
        <TextInput
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="Subtitle (optional)"
          placeholderTextColor={colors.textMuted}
          className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
        />
        <Text className="mb-2 text-xs font-medium text-muted dark:text-muted-dark">
          Subject folder (optional — General shows on Home)
        </Text>
        <View className="mb-3">
          <FolderPicker folders={folders} folderId={newFolderId} onChange={setNewFolderId} />
        </View>
        <Button label="Add Link" onPress={handleAdd} disabled={!isValid} loading={submitting} />
      </Card>

      <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
        Pending Suggestions {pending.length > 0 ? `(${pending.length})` : ''}
      </Text>
      {pending.length > 0 ? (
        <View className="mb-4">
          {pending.map((link) => (
            <Card key={link.id} className="mb-3">
              <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                {link.title}
              </Text>
              <Pressable
                onPress={() => handleOpenLink(link.url)}
                hitSlop={4}
                className="mt-0.5 flex-row items-center"
              >
                <Text className="flex-1 text-xs text-accent" numberOfLines={1}>
                  {link.url}
                </Text>
                <Ionicons name="open-outline" size={14} color="#6366F1" />
              </Pressable>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                Suggested by {link.submittedBy} · {link.createdAt}
                {link.subtitle ? ` · ${link.subtitle}` : ''}
              </Text>
              <Text className="mb-1 mt-3 text-xs font-medium text-muted dark:text-muted-dark">
                Subject folder
              </Text>
              <FolderPicker
                folders={folders}
                folderId={link.folderId ?? null}
                onChange={(folderId) => handleAssignFolder(link.id, folderId)}
              />
              <View className="mt-3 flex-row gap-2">
                <Button label="Approve" onPress={() => handleApprove(link)} className="h-9 flex-1" />
                <Button
                  label="Reject"
                  variant="ghost"
                  onPress={() => handleReject(link)}
                  className="h-9 flex-1"
                />
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <StateMessage icon="checkmark-circle-outline" title="No pending suggestions" />
      )}

      <Text className="mb-3 mt-2 text-base font-semibold text-foreground dark:text-foreground-dark">
        Existing Links
      </Text>
      {links.length > 0 ? (
        links.map((link) => (
          <Card key={link.id} className="mb-3">
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                  {link.title}
                </Text>
                <Pressable
                  onPress={() => handleOpenLink(link.url)}
                  hitSlop={4}
                  className="mt-0.5 flex-row items-center"
                >
                  <Text className="flex-1 text-xs text-accent" numberOfLines={1}>
                    {link.url}
                  </Text>
                  <Ionicons name="open-outline" size={14} color="#6366F1" />
                </Pressable>
              </View>
              <Button
                label="Delete"
                variant="ghost"
                onPress={() => handleDelete(link)}
                className="h-9 px-3"
              />
            </View>
            {folders.length > 0 && (
              <>
                <Text className="mb-1 mt-3 text-xs font-medium text-muted dark:text-muted-dark">
                  Subject folder
                </Text>
                <FolderPicker
                  folders={folders}
                  folderId={link.folderId ?? null}
                  onChange={(folderId) => handleAssignFolder(link.id, folderId)}
                />
              </>
            )}
          </Card>
        ))
      ) : (
        <StateMessage icon="link-outline" title="No links yet" />
      )}
    </ScrollView>
  );
}
