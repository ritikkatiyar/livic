import {
  ASSISTANT_SIZE,
  assistantDockBottom,
  assistantDockRight,
  DOCK_GAP,
  DOCK_SIDE_PADDING,
  dockBottom,
  liviBelongsInTopBar,
  PILL_HEIGHT,
  PILL_MAX_WIDTH,
  RAIL_MIN_WIDTH,
  RAIL_WIDTH,
} from '../../src/components/common/navigation/bottomDock';

describe('bottom dock geometry', () => {
  it('fills a phone edge to edge, with Livi at the side padding', () => {
    expect(assistantDockRight(390)).toBe(DOCK_SIDE_PADDING);
  });

  it('centres the pill and Livi together once the pill reaches its full width', () => {
    const width = 580;
    const group = PILL_MAX_WIDTH + DOCK_GAP + ASSISTANT_SIZE;
    const right = assistantDockRight(width);
    expect(right).toBe((width - group) / 2);
    // The space left of the pill matches the space right of Livi
    expect(width - right - ASSISTANT_SIZE - DOCK_GAP - PILL_MAX_WIDTH).toBe(right);
  });

  it('centres Livi in the navigation rail on tablets', () => {
    for (const width of [RAIL_MIN_WIDTH, 800]) {
      const left = width - assistantDockRight(width) - ASSISTANT_SIZE;
      // The space either side of Livi inside the rail is equal
      expect(left).toBe(RAIL_WIDTH - left - ASSISTANT_SIZE);
    }
  });

  it('keeps Livi beside the bar while the longest label fits its tab', () => {
    expect(liviBelongsInTopBar(412, 1)).toBe(false);
    expect(liviBelongsInTopBar(360, 1)).toBe(false);
  });

  it('moves Livi to the top bar when larger text would not fit the tabs', () => {
    expect(liviBelongsInTopBar(360, 1.1)).toBe(true);
    expect(liviBelongsInTopBar(412, 1.3)).toBe(true);
  });

  it('centres Livi vertically on the pill', () => {
    const insetBottom = 34;
    const pillCentre = dockBottom(insetBottom) + PILL_HEIGHT / 2;
    expect(assistantDockBottom(insetBottom) + ASSISTANT_SIZE / 2).toBe(pillCentre);
  });
});
