import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, Screen, SearchBar, StateMessage } from '@/components';
import { fetchLostFoundItems, submitLostFoundItem } from '@/features/lost-found/api';
import {
  LOST_FOUND_KIND_LABELS,
  type LostFoundInput,
  type LostFoundItem,
  type LostFoundKind,
} from '@/features/lost-found/data';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

const EMPTY_INPUT: LostFoundInput = {
  kind: 'lost',
  itemName: '',
  description: '',
  university: 'NED University',
  campus: '',
  location: '',
  contactName: '',
  whatsapp: '',
  email: '',
  photoUrl: '',
};

export default function LostFoundScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'All' | LostFoundKind>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<LostFoundInput>(EMPTY_INPUT);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setItems(await fetchLostFoundItems());
    } catch (error) {
      Alert.alert('Could not load Lost & Found', error instanceof Error ? error.message : 'Try again.');
    } finally {
      refresh ? setRefreshing(false) : setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== 'All' && item.kind !== kind) return false;
      if (!q) return true;
      return (
        item.itemName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [items, kind, query]);

  const openForm = (nextKind: LostFoundKind) => {
    setForm({
      ...EMPTY_INPUT,
      kind: nextKind,
      contactName: user?.name ?? '',
      email: user?.email ?? '',
    });
    setStep(1);
    setFormOpen(true);
  };

  const updateForm = (patch: Partial<LostFoundInput>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const canContinue =
    step === 1
      ? form.itemName.trim().length >= 2 && form.description.trim().length >= 10
      : step === 2
        ? form.location.trim().length >= 3
        : form.contactName.trim().length >= 2 && form.email.includes('@');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitLostFoundItem(form);
      setFormOpen(false);
      Alert.alert('Submitted', 'Your report will appear after admin approval.');
    } catch (error) {
      Alert.alert('Could not submit', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Screen className="items-center justify-center px-6">
        <Ionicons name="search-outline" size={42} color={colors.accent} />
        <Text className="mt-4 text-2xl font-bold text-foreground dark:text-foreground-dark">
          Lost & Found
        </Text>
        <Text className="mt-2 text-center text-base text-muted dark:text-muted-dark">
          Sign in with Google to report items and view approved contact details.
        </Text>
        <Button label="Continue with Google" onPress={() => router.push('/login')} className="mt-6" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="px-4 pt-2">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Lost & Found
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          Reports appear after admin approval.
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3 px-4">
        <Button label="Report lost" variant="ghost" onPress={() => openForm('lost')} className="flex-1" />
        <Button label="Report found" onPress={() => openForm('found')} className="flex-1" />
      </View>

      <View className="mt-4 px-4">
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search item or location..." />
      </View>
      <View className="mt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Chip label="All" selected={kind === 'All'} onPress={() => setKind('All')} />
          <Chip label="Lost" selected={kind === 'lost'} onPress={() => setKind('lost')} />
          <Chip label="Found" selected={kind === 'found'} onPress={() => setKind('found')} />
        </ScrollView>
      </View>

      {loading ? (
        <StateMessage icon="search-outline" title="Loading approved items" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Card>
              <Text className="text-xs font-bold uppercase tracking-widest text-accent">
                {LOST_FOUND_KIND_LABELS[item.kind]}
              </Text>
              <Text className="mt-2 text-lg font-bold text-foreground dark:text-foreground-dark">
                {item.itemName}
              </Text>
              <Text className="mt-2 text-sm text-muted dark:text-muted-dark">{item.description}</Text>
              <Text className="mt-3 text-xs text-muted dark:text-muted-dark">
                {item.location} · {item.createdAt}
              </Text>
              <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
                Contact: {item.contactName} · {item.email}
                {item.whatsapp ? ` · ${item.whatsapp}` : ''}
              </Text>
            </Card>
          )}
          ListEmptyComponent={
            <StateMessage icon="search-outline" title="No approved items yet" subtitle="Reports appear here after approval." />
          }
        />
      )}

      <Modal visible={formOpen} animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <Screen>
          <View className="flex-row items-center justify-between px-4 pt-2">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-widest text-accent">
                Step {step} of 3
              </Text>
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {LOST_FOUND_KIND_LABELS[form.kind]}
              </Text>
            </View>
            <Pressable onPress={() => setFormOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
            <View className="mt-4 space-y-4">
              {step === 1 && (
                <>
                  <Field label="Item name" value={form.itemName} onChangeText={(value) => updateForm({ itemName: value })} />
                  <Field
                    label="Description"
                    value={form.description}
                    onChangeText={(value) => updateForm({ description: value })}
                    multiline
                    placeholder="Color, brand, contents, marks..."
                  />
                  <Field label="Photo link (optional)" value={form.photoUrl} onChangeText={(value) => updateForm({ photoUrl: value })} />
                </>
              )}
              {step === 2 && (
                <>
                  <Field label="University" value={form.university} onChangeText={(value) => updateForm({ university: value })} />
                  <Field label="Campus (optional)" value={form.campus} onChangeText={(value) => updateForm({ campus: value })} />
                  <Field label="Specific location" value={form.location} onChangeText={(value) => updateForm({ location: value })} />
                </>
              )}
              {step === 3 && (
                <>
                  <Field label="Your name" value={form.contactName} onChangeText={(value) => updateForm({ contactName: value })} />
                  <Field label="WhatsApp number (optional)" value={form.whatsapp} onChangeText={(value) => updateForm({ whatsapp: value })} />
                  <Field label="Email" value={form.email} onChangeText={(value) => updateForm({ email: value })} />
                </>
              )}
            </View>
          </ScrollView>

          <View className="flex-row justify-between gap-3 border-t border-line p-4 dark:border-line-dark">
            <Button label="Back" variant="ghost" disabled={step === 1 || submitting} onPress={() => setStep((value) => value - 1)} className="flex-1" />
            {step < 3 ? (
              <Button label="Next" disabled={!canContinue} onPress={() => setStep((value) => value + 1)} className="flex-1" />
            ) : (
              <Button label={submitting ? 'Submitting...' : 'Submit'} disabled={!canContinue || submitting} onPress={handleSubmit} className="flex-1" />
            )}
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-2xl border border-line bg-card px-4 text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark ${
          multiline ? 'min-h-[110px] py-3' : 'h-12'
        }`}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}
