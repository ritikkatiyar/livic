import { Platform, useWindowDimensions } from 'react-native';

/**
 * Geometry shared by the floating bottom bar and Livi's bubble on mobile. They sit on one row: the pill,
 * a gap, then Livi, centred together, so Livi never floats over content above the bar.
 */
export const DOCK_SIDE_PADDING = 12;
export const DOCK_GAP = 8;
export const PILL_MAX_WIDTH = 440;
/** Inset between the pill's edge and the selected capsule; the capsule's radius is the pill's minus this. */
export const PILL_PADDING = 5;
export const PILL_BORDER = 1;
export const PILL_ITEM_HEIGHT = 50;
export const PILL_HEIGHT = PILL_ITEM_HEIGHT + (PILL_PADDING + PILL_BORDER) * 2;
/** Outer size of Livi's closed bubble, including its 1px ring. */
// Livi matches the bar's height so their tops and bottoms line up
export const ASSISTANT_SIZE = PILL_HEIGHT;

/** On web the bar is pinned by the `[data-bottom-nav]` rule in app/+html.tsx; keep the two in step. */
const WEB_DOCK_BOTTOM = 20;

/** Space between the bar and the bottom edge, clear of the gesture area on phones. */
export function dockBottom(insetBottom: number): number {
  return Platform.OS === 'web' ? WEB_DOCK_BOTTOM : Math.max(insetBottom, 12) + 4;
}

/** From this width the bar becomes a navigation rail on the left, with Livi at its foot. */
export const RAIL_MIN_WIDTH = 600;
export const RAIL_WIDTH = 80;

/**
 * Distance from the right edge to Livi. Phones: the pill and Livi centred as one group. Tablets:
 * centred in the rail, where it is near the navigation and never covers the content.
 */
export function assistantDockRight(windowWidth: number): number {
  if (windowWidth >= RAIL_MIN_WIDTH) return windowWidth - (RAIL_WIDTH + ASSISTANT_SIZE) / 2;
  const pillWidth = Math.min(PILL_MAX_WIDTH, windowWidth - DOCK_SIDE_PADDING * 2 - DOCK_GAP - ASSISTANT_SIZE);
  return Math.max(DOCK_SIDE_PADDING, (windowWidth - pillWidth - DOCK_GAP - ASSISTANT_SIZE) / 2);
}

/** Bottom offset that centres Livi vertically on the pill. */
export function assistantDockBottom(insetBottom: number): number {
  return dockBottom(insetBottom) + (PILL_HEIGHT - ASSISTANT_SIZE) / 2;
}

// The bar's tabs, and the width the longest label ("Finance") needs at the normal 12sp
const TAB_COUNT = 5;
const LONGEST_LABEL_DP = 44;
const TAB_GAP = 2;

/** The width each tab gets when Livi sits beside the bar. */
export function tabWidthBesideLivi(windowWidth: number): number {
  const pill = Math.min(PILL_MAX_WIDTH, windowWidth - DOCK_SIDE_PADDING * 2 - DOCK_GAP - ASSISTANT_SIZE);
  const inner = pill - (PILL_PADDING + PILL_BORDER) * 2 - TAB_GAP * (TAB_COUNT - 1);
  return inner / TAB_COUNT;
}

/**
 * Whether Livi should give its place beside the bar up and move into the top bar as a small button:
 * with large system text, or when the longest label would not fit its tab at the current text size.
 * Labels stay readable rather than shrinking, and the tabs get the whole bottom bar.
 */
export function liviBelongsInTopBar(windowWidth: number, fontScale: number): boolean {
  if (fontScale >= 1.3) return true;
  return tabWidthBesideLivi(windowWidth) < LONGEST_LABEL_DP * fontScale + 4;
}

export function useLiviInTopBar(): boolean {
  const { width, fontScale } = useWindowDimensions();
  // Tablets keep Livi at the foot of the navigation rail
  if (width >= RAIL_MIN_WIDTH) return false;
  return liviBelongsInTopBar(width, fontScale);
}
