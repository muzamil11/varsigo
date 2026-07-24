'use client';

import { Search } from 'lucide-react';
import React from 'react';

import { useThemeColors } from '@/store/themeStore';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }: SearchBarProps) {
  const colors = useThemeColors();
  return (
    <div className="h-12 flex flex-row items-center rounded-full border border-line bg-card px-3.5 dark:border-line-dark dark:bg-card-dark">
      <Search size={16} color={colors.textMuted} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        className="ml-2 h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted dark:text-foreground-dark dark:placeholder:text-muted-dark"
      />
    </div>
  );
}
