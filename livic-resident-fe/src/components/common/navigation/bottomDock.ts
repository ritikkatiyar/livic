import { Platform } from 'react-native';

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
export const ASSISTANT_SIZE = 56;

/** On web the bar is pinned by the `[data-bottom-nav]` rule in app/+html.tsx; keep the two in step. */
const WEB_DOCK_BOTTOM = 20;

/** Space between the bar and the bottom edge, clear of the gesture area on phones. */
export function dockBottom(insetBottom: number): number {
  return Platform.OS === 'web' ? WEB_DOCK_BOTTOM : Math.max(insetBottom, 12) + 4;
}

/** Distance from the right edge to Livi when the pill and Livi are centred as one group. */
export function assistantDockRight(windowWidth: number): number {
  const pillWidth = Math.min(PILL_MAX_WIDTH, windowWidth - DOCK_SIDE_PADDING * 2 - DOCK_GAP - ASSISTANT_SIZE);
  return Math.max(DOCK_SIDE_PADDING, (windowWidth - pillWidth - DOCK_GAP - ASSISTANT_SIZE) / 2);
}

/** Bottom offset that centres Livi vertically on the pill. */
export function assistantDockBottom(insetBottom: number): number {
  return dockBottom(insetBottom) + (PILL_HEIGHT - ASSISTANT_SIZE) / 2;
}
