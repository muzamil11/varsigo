import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { useThemeColors } from '@/store/themeStore';
import type { FaqItem } from './data';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View className="mb-3 rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
      <Pressable onPress={toggle} className="flex-row items-center justify-between p-4">
        <Text className="mr-3 flex-1 text-base font-medium text-foreground dark:text-foreground-dark">
          {item.question}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open && (
        <View className="border-t border-line px-4 pb-4 pt-3 dark:border-line-dark">
          <Text className="text-sm leading-5 text-muted dark:text-muted-dark">
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
}
