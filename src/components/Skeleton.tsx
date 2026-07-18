import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

interface SkeletonBlockProps {
  className?: string;
  style?: object;
}

/** Pulsing placeholder block — compose a few into a per-screen skeleton row. */
export function SkeletonBlock({ className, style }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`rounded-lg bg-line dark:bg-line-dark ${className ?? ''}`}
      style={[{ opacity }, style]}
    />
  );
}

/** Placeholder matching TeacherCard/PaperCard's rounded-2xl card layout. */
export function CardSkeleton() {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
      <SkeletonBlock className="h-12 w-12 rounded-full" />
      <View className="ml-3 flex-1">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="mt-2 h-3 w-1/2" />
      </View>
    </View>
  );
}

interface CardSkeletonListProps {
  count?: number;
  /** Screens with their own padded container (e.g. inside a padded
   *  ScrollView) should pass false to avoid doubling the horizontal inset. */
  padded?: boolean;
}

export function CardSkeletonList({ count = 4, padded = true }: CardSkeletonListProps) {
  return (
    <View className={padded ? 'px-4 pt-4' : undefined}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}
