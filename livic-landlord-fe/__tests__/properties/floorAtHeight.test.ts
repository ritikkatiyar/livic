import { floorAtHeight } from '@/src/features/properties/components/Building3DView';

describe('floorAtHeight', () => {
  const floors = [1, 2, 3, 4, 5];

  it('maps the bottom of the building to the lowest floor', () => {
    expect(floorAtHeight(floors, 0.05)).toBe(1);
  });

  it('maps the top of the building to the highest floor', () => {
    expect(floorAtHeight(floors, 0.95)).toBe(5);
  });

  it('splits the height evenly between floors', () => {
    expect(floorAtHeight(floors, 0.5)).toBe(3);
    expect(floorAtHeight(floors, 0.39)).toBe(2);
  });

  it('clamps taps just outside the building to the nearest floor', () => {
    expect(floorAtHeight(floors, -0.2)).toBe(1);
    expect(floorAtHeight(floors, 1.3)).toBe(5);
  });

  it('works for buildings that do not start at floor 1', () => {
    expect(floorAtHeight([3, 4], 0.9)).toBe(4);
  });
});
