import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Easing, Platform } from 'react-native';
import { Timing } from './Theme';

/**
 * Motion rules for the app. Motion only explains a change — what was selected, what appeared, what just
 * saved — and never decorates. Everything uses these durations and curves so screens move alike, and the
 * components in src/components/common/motion skip their animation when the device asks for reduced motion.
 *
 * Money is never animated: an amount mid-count is a wrong amount.
 */
export const Motion = {
  /** quick 150 (press, fades) · normal 220 (most transitions) · smooth 300 · slow 500 (fills) */
  duration: Timing,
  /** Fast start, soft landing: things arrive rather than drift. */
  easeOut: Easing.bezier(0.2, 0.8, 0.2, 1),
  /** Near-critically damped: arrives in about a quarter of a second without bouncing. */
  spring: { damping: 34, stiffness: 340, mass: 0.9 },
  /** Transform and opacity animations run off the JS thread on phones; the web has no native driver. */
  nativeDriver: Platform.OS !== 'web',
} as const;

// One subscription to the system setting, shared by every animated component on screen
let reduceMotion = false;
let isListening = false;
const listeners = new Set<() => void>();

const update = (value: boolean) => {
  reduceMotion = value;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  if (!isListening) {
    isListening = true;
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', update);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Whether the person has asked their device for less motion (the web reads prefers-reduced-motion). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduceMotion, () => reduceMotion);
}
