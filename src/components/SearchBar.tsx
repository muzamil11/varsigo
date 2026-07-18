import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';

import { useThemeColors } from '@/store/themeStore';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }: SearchBarProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center rounded-full border border-line bg-card px-3.5 dark:border-line-dark dark:bg-card-dark">
      <Ionicons name="search" size={16} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        className="ml-2 h-10 flex-1 text-sm text-foreground dark:text-foreground-dark"
        style={{ textAlignVertical: 'center', includeFontPadding: false, paddingVertical: 0 }}
        returnKeyType="search"
      />
    </View>
  );
}
