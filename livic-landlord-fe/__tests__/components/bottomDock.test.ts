import {
  ASSISTANT_SIZE,
  assistantDockBottom,
  assistantDockRight,
  DOCK_GAP,
  DOCK_SIDE_PADDING,
  dockBottom,
  PILL_HEIGHT,
  PILL_MAX_WIDTH,
} from '../../src/components/common/navigation/bottomDock';

describe('bottom dock geometry', () => {
  it('fills a phone edge to edge, with Livi at the side padding', () => {
    expect(assistantDockRight(390)).toBe(DOCK_SIDE_PADDING);
  });

  it('centres the pill and Livi together once the pill reaches its full width', () => {
    const width = 800;
    const group = PILL_MAX_WIDTH + DOCK_GAP + ASSISTANT_SIZE;
    const right = assistantDockRight(width);
    expect(right).toBe((width - group) / 2);
    // The space left of the pill matches the space right of Livi
    expect(width - right - ASSISTANT_SIZE - DOCK_GAP - PILL_MAX_WIDTH).toBe(right);
  });

  it('centres Livi vertically on the pill', () => {
    const insetBottom = 34;
    const pillCentre = dockBottom(insetBottom) + PILL_HEIGHT / 2;
    expect(assistantDockBottom(insetBottom) + ASSISTANT_SIZE / 2).toBe(pillCentre);
  });
});
