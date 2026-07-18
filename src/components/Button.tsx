import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, Text } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SCALE = 0.97;

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 50 }).start();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animateTo(PRESS_SCALE)}
      onPressOut={() => animateTo(1)}
      disabled={disabled || loading}
      className={`h-12 items-center justify-center rounded-xl px-6 active:opacity-80 ${
        isPrimary
          ? disabled
            ? 'bg-accent/40'
            : 'bg-accent'
          : 'border border-line bg-transparent dark:border-line-dark'
      } ${className ?? ''}`}
      style={{ transform: [{ scale }] }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          className={
            isPrimary
              ? 'text-base font-semibold text-white'
              : 'text-base font-medium text-foreground dark:text-foreground-dark'
          }
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
