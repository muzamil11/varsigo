import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Modal,
} from 'react-native';

import { AnimatedListItem, Button, CardSkeletonList, Screen, StateMessage } from '@/components';
import { fetchImportantLinks, suggestImportantLink } from '@/features/links/api';
import type { ImportantLink } from '@/features/links/data';
import { ImportantLinkCard } from '@/features/links/ImportantLinkCard';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

export default function ImportantLinksScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [suggestVisible, setSuggestVisible] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState('');
  const [suggestUrl, setSuggestUrl] = useState('');
  const [suggestSubtitle, setSuggestSubtitle] = useState('');
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLinks(await fetchImportantLinks());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeSuggestModal = () => {
    setSuggestVisible(false);
    setSuggestTitle('');
    setSuggestUrl('');
    setSuggestSubtitle('');
  };

  const handleOpenSuggest = () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      Alert.alert('Please log in', 'You need to be logged in to suggest a link.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    setSuggestVisible(true);
  };

  const handleSuggestSubmit = async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    if (!suggestTitle.trim() || !suggestUrl.trim()) return;

    setSuggestSubmitting(true);
    try {
      await suggestImportantLink({
        userId: currentUser.id,
        title: suggestTitle.trim(),
        url: suggestUrl.trim(),
        subtitle: suggestSubtitle.trim() || undefined,
      });
      closeSuggestModal();
      Alert.alert('Thanks!', 'Your link has been sent for review.');
    } catch (err) {
      Alert.alert(
        'Could not submit link',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setSuggestSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Important Links
        </Text>
      </View>

      {loading ? (
        <CardSkeletonList count={4} />
      ) : error ? (
        <StateMessage
          icon="alert-circle-outline"
          title="Couldn't load links"
          subtitle={error}
          onRetry={load}
        />
      ) : links.length === 0 ? (
        <StateMessage icon="link-outline" title="No links yet" subtitle="Check back later." />
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}>
          {links.map((link, index) => (
            <AnimatedListItem key={link.id} index={index}>
              <ImportantLinkCard link={link} />
            </AnimatedListItem>
          ))}
        </ScrollView>
      )}

      <Pressable
        onPress={handleOpenSuggest}
        hitSlop={8}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-accent"
        style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal visible={suggestVisible} animationType="slide" transparent onRequestClose={closeSuggestModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="rounded-t-3xl bg-background px-4 pb-8 pt-6 dark:bg-background-dark">
              <Text className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
                Suggest a Link
              </Text>
              <TextInput
                value={suggestTitle}
                onChangeText={setSuggestTitle}
                placeholder="Title (e.g. CS Batch 2026 WhatsApp Group)"
                placeholderTextColor={colors.textMuted}
                className="mb-3 h-12 rounded-xl border border-line bg-card px-3 text-base text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
              />
              <TextInput
                value={suggestUrl}
                onChangeText={setSuggestUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                className="mb-3 h-12 rounded-xl border border-line bg-card px-3 text-base text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
              />
              <TextInput
                value={suggestSubtitle}
                onChangeText={setSuggestSubtitle}
                placeholder="Subtitle (optional)"
                placeholderTextColor={colors.textMuted}
                className="mb-4 h-12 rounded-xl border border-line bg-card px-3 text-base text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
              />
              <Text className="mb-4 text-xs text-muted dark:text-muted-dark">
                Your link is sent for admin review before it appears for everyone.
              </Text>
              <Button
                label="Submit for Review"
                onPress={handleSuggestSubmit}
                disabled={!suggestTitle.trim() || !suggestUrl.trim()}
                loading={suggestSubmitting}
              />
              <Button label="Cancel" variant="ghost" onPress={closeSuggestModal} className="mt-3" />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
