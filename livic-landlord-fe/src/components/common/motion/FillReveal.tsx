import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { Motion, useReducedMotion } from '@/src/theme/motion';

interface FillRevealProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Grows in from its left edge when it first appears, like a progress or occupancy bar filling up. */
export function FillReveal({ style, children }: FillRevealProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: Motion.duration.slow,
      easing: Motion.easeOut,
      useNativeDriver: Motion.nativeDriver,
    }).start();
  }, [progress, reduceMotion]);

  return (
    <Animated.View style={[style, { transformOrigin: 'left', transform: [{ scaleX: progress }] }]}>
      {children}
    </Animated.View>
  );
}
