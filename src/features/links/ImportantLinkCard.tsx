import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Text, View } from 'react-native';

import { Card } from '@/components';
import type { ImportantLink } from './data';

export function ImportantLinkCard({ link }: { link: ImportantLink }) {
  const handlePress = () => {
    Linking.openURL(link.url).catch(() =>
      Alert.alert('Could not open link', 'Please check your internet connection and try again.'),
    );
  };

  return (
    <Card onPress={handlePress} className="mb-3 flex-row items-center">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/15">
        <Ionicons name="link-outline" size={18} color="#6366F1" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          {link.title}
        </Text>
        {link.subtitle && (
          <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{link.subtitle}</Text>
        )}
      </View>
      <Ionicons name="open-outline" size={16} color="#71717A" />
    </Card>
  );
}
