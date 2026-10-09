import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticKind = 'success' | 'error' | 'warning' | 'tap' | 'press';

/**
 * One firm, short pulse per moment, named for what happened rather than how it buzzes.
 *
 * Android vibrates directly at the device's normal strength: expo-haptics caps its Android patterns
 * at about a quarter of full amplitude, and the system haptic constants follow the phone's (often soft)
 * touch-feedback setting. Keeping each pulse to a few tens of milliseconds is what keeps it tight.
 * iOS keeps its notification haptics, with rigid and heavy impacts for taps.
 */
export function haptic(kind: HapticKind): void {
  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    Vibration.vibrate(ANDROID_PATTERNS[kind]);
    return;
  }

  const played =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
      : kind === 'press'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        : Haptics.notificationAsync(IOS_NOTIFICATION[kind]);
  played.catch(() => {});
}

// Android patterns are [wait, buzz, wait, buzz, ...] in milliseconds
const ANDROID_PATTERNS: Record<HapticKind, number[]> = {
  tap: [0, 18],
  press: [0, 30],
  success: [0, 22, 70, 30],
  warning: [0, 35, 90, 35],
  error: [0, 30, 55, 30, 55, 30],
};

const IOS_NOTIFICATION = {
  success: Haptics.NotificationFeedbackType.Success,
  error: Haptics.NotificationFeedbackType.Error,
  warning: Haptics.NotificationFeedbackType.Warning,
} as const;
