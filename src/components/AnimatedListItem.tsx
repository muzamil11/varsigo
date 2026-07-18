import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const STAGGER_DELAY_MS = 50;
const DURATION_MS = 250;
const SLIDE_DISTANCE = 12;

interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
}

/** Slides + fades a list row in on mount, staggered by its index so a
 *  freshly loaded list animates in one row after another. Wrap each
 *  FlatList renderItem's returned element in this. */
export function AnimatedListItem({ children, index = 0 }: AnimatedListItemProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      delay: index * STAGGER_DELAY_MS,
      useNativeDriver: true,
    }).start();
    // Animate once per mount only — deliberately not re-running on index change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [SLIDE_DISTANCE, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
