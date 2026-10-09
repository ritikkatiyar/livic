import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { haptic as playHaptic } from '@/src/theme/haptics';
import { Motion, useReducedMotion } from '@/src/theme/motion';

// Each swing a little smaller than the last: about a quarter of a second in all
const SWINGS = [-6, 5, -3, 2, 0];

/**
 * A short sideways shake that says "that didn't work", for a wrong OTP or a rejected form. Spread
 * `shakeStyle` onto the view to move; call `shake()` when the error arrives.
 */
export function useShake({ haptic = false }: { haptic?: boolean } = {}) {
  const reduceMotion = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    if (haptic) playHaptic('error');
    if (reduceMotion) return;
    offset.setValue(0);
    Animated.sequence(
      SWINGS.map((toValue) =>
        Animated.timing(offset, { toValue, duration: 55, easing: Easing.out(Easing.quad), useNativeDriver: Motion.nativeDriver })
      )
    ).start();
  }, [haptic, offset, reduceMotion]);

  return { shakeStyle: { transform: [{ translateX: offset }] }, shake };
}
