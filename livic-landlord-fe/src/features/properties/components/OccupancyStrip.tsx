import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { PortfolioOccupancyResponse } from '@/src/features/analytics/api/analytics.api';
import { OCCUPANCY_STATES, OccupancyState, getOccupancyColors } from '@/src/features/properties/utils/occupancy';
import { FillReveal } from '@/src/components/common/motion/FillReveal';
import { OccupancyLegend } from './OccupancyLegend';

interface OccupancyStripProps {
  occupancy?: PortfolioOccupancyResponse;
  isLoading?: boolean;
}

/**
 * Lightweight occupancy summary for property list cards: one stacked bar plus counts.
 * Replaces the interactive 3D building in lists, which was too heavy to render per card.
 */
export function OccupancyStrip({ occupancy, isLoading }: OccupancyStripProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const full = occupancy?.fullUnits ?? 0;
  const partial = occupancy?.partialUnits ?? 0;
  const vacant = occupancy?.vacantUnits ?? 0;
  const total = full + partial + vacant;

  if (isLoading && !occupancy) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonLine, { width: '40%' }]} />
        <View style={styles.track} />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.headline}>No units yet</Text>
        <Text style={styles.muted}>Set up floors and units to track occupancy.</Text>
      </View>
    );
  }

  // Share of units with at least one tenant
  const occupancyPct = Math.round(((full + partial) / total) * 100);
  const counts: Record<OccupancyState, number> = { occupied: full, partial, vacant };

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${occupancyPct}% occupancy. ${full} occupied, ${partial} partially filled, ${vacant} vacant of ${total} units.`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headline}>{occupancyPct}% occupancy</Text>
        <Text style={styles.muted}>{total} units</Text>
      </View>

      <View style={styles.track}>
        <FillReveal style={styles.fill}>
          {OCCUPANCY_STATES.map((state) =>
            counts[state] > 0 ? (
              <View key={state} style={{ flex: counts[state], backgroundColor: getOccupancyColors(theme, state).fill }} />
            ) : null
          )}
        </FillReveal>
      </View>

      {/* Also serves as the key for the 3D building above, which hides its own overlay legend */}
      <OccupancyLegend counts={counts} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: theme.Spacing.sm,
      padding: theme.Spacing.md,
      borderRadius: theme.Rounded.lg,
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    headline: {
      fontSize: theme.Typography.titleMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    muted: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.onSurfaceVariant,
    },
    track: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: theme.Colors.surfaceContainerHighest,
    },
    fill: {
      flex: 1,
      flexDirection: 'row',
      gap: 2,
    },
    skeletonLine: {
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.Colors.surfaceContainerHighest,
    },
  });
