import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Button, Screen } from '@/components';
import { usePrivacyStore } from '@/store/privacyStore';

export default function PrivacyNoticeScreen() {
  const router = useRouter();

  const handleAccept = () => {
    usePrivacyStore.getState().accept();
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View className="flex-1 justify-center px-4">
        <View className="mb-6 h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
        </View>
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Privacy Notice
        </Text>
        <Text className="mt-4 text-base leading-6 text-muted dark:text-muted-dark">
          Varsigo stores your phone number and name to personalize your experience. Your
          reviews can be posted anonymously. We never sell your data. Files you upload are shared
          with all NED students.
        </Text>

        <Button label="Accept & Continue" onPress={handleAccept} className="mt-8" />
      </View>
    </Screen>
  );
}
