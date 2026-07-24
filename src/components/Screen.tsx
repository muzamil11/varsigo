import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
}

/** Themed safe-area wrapper every screen sits inside. Its content fades in
 *  on mount (300ms) so screen-to-screen navigation feels less abrupt.
 *
 *  Deliberately does NOT wrap children in a screen-wide
 *  TouchableWithoutFeedback for keyboard dismiss — that pattern sits
 *  directly in the touch-responder chain above every scrollable on the
 *  screen, and on Android it's a well-documented cause of inconsistent,
 *  "sticky" scroll behavior (some lists scroll fine, others feel stuck).
 *  Every screen with a keyboard to dismiss already sets
 *  `keyboardDismissMode="on-drag"` on its own ScrollView/FlatList instead,
 *  which gets the same UX without sitting above the scroll gesture. */
export function Screen({ children, className }: ScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <Animated.View className={`flex-1 ${className ?? ''}`} style={{ opacity }}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}
