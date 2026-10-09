import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Motion, useReducedMotion } from '@/src/theme/motion';

interface SuccessCheckProps {
  color: string;
  size?: number;
  /** Change it to play the check again, e.g. the id of a new toast. */
  playKey?: string;
}

/** A check that draws itself: the ring grows in, then the tick sweeps in from the left. */
export function SuccessCheck({ color, size = 24, playKey }: SuccessCheckProps) {
  const reduceMotion = useReducedMotion();
  const ring = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;
  const tickSize = Math.round(size * 0.7);

  useEffect(() => {
    if (reduceMotion) {
      ring.setValue(1);
      tick.setValue(1);
      return;
    }
    ring.setValue(0);
    tick.setValue(0);
    Animated.sequence([
      Animated.timing(ring, { toValue: 1, duration: Motion.duration.normal, easing: Motion.easeOut, useNativeDriver: Motion.nativeDriver }),
      // Width can't use the native driver; it is a 24px mask, so the JS thread copes easily
      Animated.timing(tick, { toValue: 1, duration: Motion.duration.normal, easing: Motion.easeOut, useNativeDriver: false }),
    ]).start();
  }, [playKey, reduceMotion, ring, tick]);

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel="Done">
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: size / 2,
            borderWidth: Math.max(2, size / 12),
            borderColor: color,
            opacity: ring,
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.tickMask,
          {
            top: (size - tickSize) / 2,
            left: (size - tickSize) / 2,
            height: tickSize,
            width: tick.interpolate({ inputRange: [0, 1], outputRange: [0, tickSize] }),
          },
        ]}
      >
        <View style={{ width: tickSize }}>
          <MaterialIcons name="check" size={tickSize} color={color} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tickMask: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
