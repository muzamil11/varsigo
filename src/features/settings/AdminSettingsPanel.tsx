import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';

import { Card, CardSkeletonList, StateMessage } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';
import { fetchModerationSettings, updateModerationSettings } from './api';
import type { ModerationSettings } from './data';

const TOGGLES: { key: keyof ModerationSettings; label: string; subtitle: string }[] = [
  {
    key: 'reviewsRequireApproval',
    label: 'Teacher reviews',
    subtitle: 'New reviews wait for admin approval before appearing publicly.',
  },
  {
    key: 'uploadsRequireApproval',
    label: 'Past papers & notes',
    subtitle: 'New uploads wait for admin approval before appearing in Papers.',
  },
  {
    key: 'teacherSuggestionsRequireApproval',
    label: 'Teacher suggestions',
    subtitle: 'Student-suggested teachers wait for admin approval before being added.',
  },
  {
    key: 'importantLinksRequireApproval',
    label: 'Important Links',
    subtitle: 'Student-suggested links wait for admin approval before appearing on Home.',
  },
];

/** Global on/off switches for the "requires admin approval" behavior on
 *  each user-submission flow — flip one off and future submissions for
 *  that content type insert already approved, no code change needed.
 *  Doesn't cover Lost & Found, which always goes through a separate
 *  Supabase Edge Function (see supabase/schema.sql's moderation_settings
 *  comment) rather than a direct client insert this app controls. */
export function AdminSettingsPanel() {
  const colors = useThemeColors();
  const adminEmail = useAuthStore((s) => s.user?.email);

  const [settings, setSettings] = useState<ModerationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof ModerationSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await fetchModerationSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (key: keyof ModerationSettings, value: boolean) => {
    if (!adminEmail || !settings) return;
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    setSavingKey(key);
    try {
      await updateModerationSettings(adminEmail, { [key]: value });
    } catch (err) {
      setSettings(previous);
      Alert.alert('Could not update setting', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <CardSkeletonList />;
  if (error || !settings) {
    return (
      <StateMessage
        icon="cloud-offline-outline"
        title="Couldn't load settings"
        subtitle={error ?? undefined}
        onRetry={load}
      />
    );
  }

  return (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}>
      <Text className="mb-4 text-xs text-muted dark:text-muted-dark">
        Turn a switch off to auto-approve that content type immediately on submit — no admin review,
        no code change. Turn it back on any time to go back to requiring approval.
      </Text>
      {TOGGLES.map((toggle) => (
        <Card key={toggle.key} className="mb-3 flex-row items-center">
          <View className="mr-3 flex-1">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              {toggle.label}
            </Text>
            <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{toggle.subtitle}</Text>
          </View>
          <Switch
            value={settings[toggle.key]}
            onValueChange={(value) => handleToggle(toggle.key, value)}
            disabled={savingKey === toggle.key}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#FFFFFF"
          />
        </Card>
      ))}

      <Card className="mt-2 opacity-60">
        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
          Lost & Found
        </Text>
        <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
          Handled by a separate server function — not controllable from here.
        </Text>
      </Card>
    </ScrollView>
  );
}
