import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button, Screen } from '@/components';
import { updateUserName } from '@/features/auth/api';
import { getPostAuthRoute } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';
import { useThemeColors } from '@/store/themeStore';

export default function OnboardingNameScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    const user = useAuthStore.getState().user;
    if (!user) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateUserName(user.id, trimmed);
      useAuthStore.getState().updateUser(updated);
      router.replace(getPostAuthRoute(updated, usePrivacyStore.getState().accepted));
    } catch (error) {
      Alert.alert('Could not save name', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-4"
      >
        <View className="mb-10">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Ionicons name="person" size={28} color="#FFFFFF" />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            What&apos;s your name?
          </Text>
          <Text className="mt-2 text-base text-muted dark:text-muted-dark">
            This is how you&apos;ll appear on reviews you post publicly.
          </Text>
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ali Khan"
          placeholderTextColor={colors.textMuted}
          autoFocus
          autoCapitalize="words"
          className="mb-6 h-14 rounded-xl border border-line bg-card px-4 text-lg text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />

        <Button
          label="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={name.trim().length === 0}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
