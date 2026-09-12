import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MeterReadingSummaryProps {
  totalUnits: number;
  readingsEntered: number;
  selectedConfigName: string | undefined;
  unitType: string | undefined;
  baseRate: number;
  billingMonthName: string;
  billingYear: number;
  totalConsumption: number;
  totalEstimatedCost: number;
}

export function MeterReadingSummary({
  totalUnits,
  readingsEntered,
  selectedConfigName,
  unitType,
  baseRate,
  billingMonthName,
  billingYear,
  totalConsumption,
  totalEstimatedCost,
}: MeterReadingSummaryProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>WORKSHEET SUMMARY</Text>
      
      <View style={styles.summaryMetricsGrid}>
        <View style={styles.summaryMetricItem}>
          <Text style={styles.summaryMetricLabel}>TOTAL UNITS</Text>
          <Text style={styles.summaryMetricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {totalUnits}
          </Text>
        </View>
        <View style={styles.summaryMetricItem}>
          <Text style={styles.summaryMetricLabel}>READINGS ENTERED</Text>
          <Text style={styles.summaryMetricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {readingsEntered} / {totalUnits}
          </Text>
        </View>
      </View>

      <View style={styles.previewDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Utility Charge</Text>
        <Text style={styles.summaryValue}>{selectedConfigName || 'N/A'}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Rate</Text>
        <Text style={styles.summaryValue}>₹{baseRate} / {unitType || 'unit'}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Billing Period</Text>
        <Text style={styles.summaryValue}>{billingMonthName} {billingYear}</Text>
      </View>

      <View style={styles.previewDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Consumption</Text>
        <Text style={[styles.summaryValue, { color: theme.Colors.primary, fontSize: theme.Typography.bodyLarge.fontSize }]}>
          {totalConsumption.toFixed(2)} {unitType || 'Units'}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Estimated Billing</Text>
        <Text style={[styles.summaryValue, { color: theme.Colors.primary, fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600' }]}>
          ₹{totalEstimatedCost.toFixed(2)}
        </Text>
      </View>

      {readingsEntered < totalUnits && (
        <View style={styles.warningAlertBox}>
          <MaterialIcons name="info-outline" size={18} color={theme.Colors.tertiary} />
          <Text style={styles.warningAlertText}>
            {totalUnits - readingsEntered} unit(s) are missing current month readings.
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  summaryCard: {
    padding: theme.Spacing.lg,
    borderRadius: 16,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    overflow: 'hidden',
  },
  summaryCardTitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.md,
  },
  summaryMetricItem: {
    flex: 1,
    minWidth: 120,
    padding: theme.Spacing.md,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  summaryMetricLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  summaryMetricValue: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginTop: 6,
  },
  previewDivider: {
    height: 1,
    backgroundColor: theme.Colors.outlineVariant,
    marginVertical: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: isDark ? 'rgba(243, 191, 38, 0.1)' : 'rgba(239, 108, 0, 0.06)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(243, 191, 38, 0.25)' : 'rgba(239, 108, 0, 0.15)',
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  warningAlertText: {
    flex: 1,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.tertiary,
    lineHeight: 16,
  },
});
