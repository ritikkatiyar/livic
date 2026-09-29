import { Timing } from '@/src/theme/Theme';

/**
 * Screen options shared by every stack (root and each tab's own stack): no native header
 * (the app draws its own), transparent background so the layout gradient shows, and the
 * same short fade the app has always used between screens.
 */
export const STACK_SCREEN_OPTIONS = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
  animation: 'fade',
  animationDuration: Timing.normal,
} as const;
