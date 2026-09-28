/**
 * Single source of truth for how unit occupancy is classified and colored, shared by the
 * 3D building, floor plans, the floor editor and the Home occupancy strip.
 *
 * Teal means occupied (good for a landlord), amber partial, grey outline vacant.
 */
export type OccupancyState = 'occupied' | 'partial' | 'vacant';

export const OCCUPANCY_STATES: OccupancyState[] = ['occupied', 'partial', 'vacant'];

export const OCCUPANCY_LABELS: Record<OccupancyState, string> = {
  occupied: 'Occupied',
  partial: 'Partial',
  vacant: 'Vacant',
};

/** Mirrors the backend's UnitOccupancy.of: a missing or zero capacity counts as one bed. */
export function getOccupancyState(activeLeases: number, capacity?: number | null): OccupancyState {
  const beds = capacity && capacity > 0 ? capacity : 1;
  if (activeLeases <= 0) return 'vacant';
  return activeLeases < beds ? 'partial' : 'occupied';
}

export interface OccupancyColors {
  /** Strong fill (selected/hovered units, solid floor-plan tiles, bar segments). */
  fill: string;
  /** Text/icon color on top of `fill`. */
  onFill: string;
  /** Soft tint for accents and floor-plan chips. */
  container: string;
  /** Resting 3D unit color: strong enough to read against a neutral backdrop in both themes. */
  tint: string;
  border: string;
  /** Vacant is drawn as an outline/hollow ring rather than a filled dot. */
  hollow: boolean;
}

export function getOccupancyColors(theme: any, state: OccupancyState): OccupancyColors {
  const c = theme.Colors;
  switch (state) {
    case 'occupied':
      return { fill: c.primary, onFill: c.onPrimary, container: c.primaryContainer, tint: c.primaryTint, border: c.primary, hollow: false };
    case 'partial':
      return { fill: c.tertiary, onFill: c.onTertiary, container: c.tertiaryContainer, tint: c.tertiaryTint, border: c.tertiary, hollow: false };
    case 'vacant':
      return { fill: c.surfaceContainerHighest, onFill: c.onSurface, container: c.surfaceContainerHigh, tint: c.surfaceContainerLowest, border: c.onSurfaceVariant, hollow: true };
  }
}
