import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Motion, useReducedMotion } from '@/src/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Opacity while held, like TouchableOpacity's; 1 keeps it opaque. */
  activeOpacity?: number;
  /** How far it settles in while held. */
  pressedScale?: number;
};

/** A touchable that settles in slightly while held, so a tap feels physical. A drop-in for TouchableOpacity. */
export function PressableScale({
  style,
  activeOpacity = 1,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  children,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useRef(new Animated.Value(0)).current;
  // Keeps a caller's own opacity, e.g. a dimmed disabled button
  const styleOpacity = StyleSheet.flatten(style)?.opacity;
  const baseOpacity = typeof styleOpacity === 'number' ? styleOpacity : 1;

  const animateTo = (toValue: number) =>
    Animated.timing(pressed, {
      toValue,
      duration: toValue ? Motion.duration.quick / 2 : Motion.duration.quick,
      easing: Motion.easeOut,
      useNativeDriver: Motion.nativeDriver,
    }).start();

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole={accessibilityRole}
      onPressIn={(e) => {
        animateTo(1);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(0);
        onPressOut?.(e);
      }}
      style={[
        style,
        {
          opacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity, baseOpacity * activeOpacity] }),
          transform: reduceMotion ? [] : [{ scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, pressedScale] }) }],
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
