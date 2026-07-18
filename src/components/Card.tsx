import React, { useRef } from 'react';
import { Animated, Pressable, View, type ViewProps } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SCALE = 0.97;

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

/** Surface container. Renders as Pressable (with press feedback + a subtle
 *  scale-down) when onPress is given. */
export function Card({ children, onPress, className, style, ...rest }: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const base = `rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark ${className ?? ''}`;

  if (onPress) {
    const animateTo = (toValue: number) =>
      Animated.spring(scale, { toValue, useNativeDriver: true, speed: 50 }).start();

    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => animateTo(PRESS_SCALE)}
        onPressOut={() => animateTo(1)}
        className={`${base} active:opacity-80`}
        {...rest}
        style={[style, { transform: [{ scale }] }]}
      >
        {children}
      </AnimatedPressable>
    );
  }
  return (
    <View className={base} style={style} {...rest}>
      {children}
    </View>
  );
}
