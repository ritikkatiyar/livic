import { withAlpha } from '@/src/theme/colorUtils';

describe('withAlpha', () => {
  it('converts 6-digit hex', () => {
    expect(withAlpha('#0E4F52', 0.1)).toBe('rgba(14, 79, 82, 0.1)');
  });

  it('expands 3-digit hex', () => {
    expect(withAlpha('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('replaces an existing alpha', () => {
    expect(withAlpha('rgba(79, 163, 166, 0.15)', 0.4)).toBe('rgba(79, 163, 166, 0.4)');
  });

  it('clamps alpha to 0..1', () => {
    expect(withAlpha('#000000', 2)).toBe('rgba(0, 0, 0, 1)');
    expect(withAlpha('#000000', -1)).toBe('rgba(0, 0, 0, 0)');
  });
});
