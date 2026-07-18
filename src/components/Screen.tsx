import React, { useEffect, useRef } from 'react';
import { Animated, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
}

/** Themed safe-area wrapper every screen sits inside. Its content fades in
 *  on mount (300ms) so screen-to-screen navigation feels less abrupt, and
 *  tapping anywhere that isn't itself a touchable (an input, a button, a
 *  list row, …) dismisses the keyboard — applied once here rather than in
 *  every screen since every screen already renders <Screen> as its root. */
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {/* className (e.g. alignment utilities like items-center) lives here,
            not on the SafeAreaView above — this is the box children actually
            render into, so it's the one that needs to own that layout. */}
        <Animated.View className={`flex-1 ${className ?? ''}`} style={{ opacity }}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
