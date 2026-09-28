import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import {
  OCCUPANCY_LABELS,
  OCCUPANCY_STATES,
  OccupancyState,
  getOccupancyColors,
} from '@/src/features/properties/utils/occupancy';

interface OccupancyLegendProps {
  /** When given, each item shows its count, e.g. "12 vacant". */
  counts?: Partial<Record<OccupancyState, number>>;
  style?: StyleProp<ViewStyle>;
}

/** Occupied / partial / vacant key, using the same colors as the building and floor plans. */
export function OccupancyLegend({ counts, style }: OccupancyLegendProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.legend, style]}>
      {OCCUPANCY_STATES.map((state) => {
        const colors = getOccupancyColors(theme, state);
        const label = OCCUPANCY_LABELS[state];
        return (
          <View key={state} style={styles.item}>
            <View
              style={[
                styles.dot,
                colors.hollow ? { borderWidth: 1.5, borderColor: colors.border } : { backgroundColor: colors.fill },
              ]}
            />
            <Text style={styles.text}>{counts ? `${counts[state] ?? 0} ${label.toLowerCase()}` : label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    // Wraps onto a second line on narrow screens rather than truncating
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: theme.Spacing.md,
      rowGap: 4,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    text: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.onSurfaceVariant,
    },
  });
