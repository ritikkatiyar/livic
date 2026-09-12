import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { TrajectoryPoint, getHistoricalTrajectory } from '../api/analytics.api';
import { GlassCard } from '@/src/components/common/display/GlassCard';

interface TrajectoryChartProps {
  token: string;
}

export function TrajectoryChart({ token }: TrajectoryChartProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [range, setRange] = useState<'1W' | '1M' | '3M'>('1M');
  const [data, setData] = useState<TrajectoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getHistoricalTrajectory(token, range)
      .then((points) => {
        if (mounted) {
          setData(points);
          setActiveIdx(points.length - 1);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [token, range]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.expected, d.collected)), 1000);

  return (
    <GlassCard style={styles.card} contentStyle={styles.cardContent}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Revenue & Growth Trajectory</Text>
          <Text style={styles.subtitle}>Portfolio financial performance over time</Text>
        </View>

        {/* Time Filter Chips */}
        <View style={styles.rangeSelector}>
          {(['1W', '1M', '3M'] as const).map((r) => {
            const isActive = range === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.rangeBtn, isActive && styles.rangeBtnActive]}
                onPress={() => setRange(r)}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.rangeText, isActive && styles.rangeTextActive]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chart Canvas */}
      <View style={styles.chartContainer}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.Colors.primary} />
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No historical billing records found</Text>
          </View>
        ) : (
          <>
            {/* Active Data Tooltip */}
            {activeIdx !== null && data[activeIdx] && (
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>{data[activeIdx].label} Cycle:</Text>
                <View style={styles.tooltipPill}>
                  <View style={[styles.dot, { backgroundColor: theme.Colors.primary }]} />
                  <Text style={styles.tooltipVal}>
                    Expected: ₹{data[activeIdx].expected.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.tooltipPill}>
                  <View style={[styles.dot, { backgroundColor: theme.Colors.tertiary || '#00e0ff' }]} />
                  <Text style={styles.tooltipVal}>
                    Collected: ₹{data[activeIdx].collected.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Bars Canvas */}
            <View style={styles.barsCanvas}>
              {data.map((point, idx) => {
                const isSelected = activeIdx === idx;
                const expHeight = Math.max(12, Math.round((point.expected / maxVal) * 160));
                const colHeight = Math.max(8, Math.round((point.collected / maxVal) * 160));

                return (
                  <TouchableOpacity
                    key={point.period}
                    style={styles.barColumn}
                    activeOpacity={0.8}
                    onPress={() => setActiveIdx(idx)}
                  >
                    <View style={styles.barsPair}>
                      {/* Expected Bar */}
                      <View
                        style={[
                          styles.bar,
                          {
                            height: expHeight,
                            backgroundColor: isSelected
                              ? `${theme.Colors.primary}80`
                              : `${theme.Colors.primary}35`,
                          },
                        ]}
                      />
                      {/* Collected Bar */}
                      <View
                        style={[
                          styles.bar,
                          styles.barCollected,
                          {
                            height: colHeight,
                            backgroundColor: isSelected
                              ? theme.Colors.primary
                              : `${theme.Colors.primary}90`,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        isSelected && { color: theme.Colors.primary, fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {point.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: `${theme.Colors.primary}45` }]} />
                <Text style={styles.legendText}>Expected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.Colors.primary }]} />
                <Text style={styles.legendText}>Collected</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </GlassCard>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      flex: 1,
      borderRadius: 24,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    title: {
      fontSize: theme.Typography.titleLarge?.fontSize || 18,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 12,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    rangeSelector: {
      flexDirection: 'row',
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderRadius: 18,
      padding: 3,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      alignItems: 'center',
    },
    rangeBtn: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 15,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rangeBtnActive: {
      backgroundColor: theme.Colors.surfaceContainerLowest,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    rangeText: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.Colors.onSurfaceVariant,
    },
    rangeTextActive: {
      fontWeight: '600',
      color: theme.Colors.primary,
    },
    chartContainer: {
      minHeight: 230,
      justifyContent: 'center',
    },
    loadingBox: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyBox: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: theme.Colors.onSurfaceVariant,
    },
    tooltipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    tooltipLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    tooltipPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.Colors.surfaceContainerLow,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    tooltipVal: {
      fontSize: 11,
      color: theme.Colors.onSurfaceVariant,
      fontWeight: '500',
    },
    barsCanvas: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      height: 180,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.Colors.outlineVariant,
    },
    barColumn: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
      height: '100%',
    },
    barsPair: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      justifyContent: 'center',
      width: '100%',
    },
    bar: {
      width: '32%',
      maxWidth: 16,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    barCollected: {
      shadowColor: theme.Colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    barLabel: {
      fontSize: 10,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 16,
      marginTop: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 11,
      color: theme.Colors.onSurfaceVariant,
    },
  });
