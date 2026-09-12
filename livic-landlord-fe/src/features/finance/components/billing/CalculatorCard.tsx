import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface CalculatorCardProps {
  expectedAITasks: number;
  additionalUnits: number;
  isAnnual: boolean;
  width: number;
  setExpectedAITasks: (val: number) => void;
  setAdditionalUnits: (val: number) => void;
}

export function CalculatorCard({
  expectedAITasks,
  additionalUnits,
  isAnnual,
  width,
  setExpectedAITasks,
  setAdditionalUnits,
}: CalculatorCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const calculateEstimatedTotal = () => {
    const aiTasks = isNaN(expectedAITasks) ? 1000 : expectedAITasks;
    const units = isNaN(additionalUnits) ? 5 : additionalUnits;
    const basePrice = 1599;
    const additionalCreditsCost = Math.max(0, aiTasks - 1000) * 1.50;
    const unitsCost = units * 100;
    let total = basePrice + additionalCreditsCost + unitsCost;
    if (isAnnual) {
      total = total * 0.8;
    }
    return Math.round(total).toLocaleString('en-IN');
  };

  return (
    <View style={styles.calculatorCard}>
      <Text style={styles.calculatorTitle}>INTERACTIVE PAY-AS-YOU-GO CALCULATOR</Text>
      <Text style={styles.calculatorSub}>Estimate custom SaaS billing limits tailored to your scale:</Text>

      <View style={styles.sliderSection}>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>Expected Monthly AI Tasks</Text>
          <Text style={styles.sliderValue}>{(isNaN(expectedAITasks) ? 1000 : expectedAITasks).toLocaleString()}</Text>
        </View>

        <View style={styles.trackContainer}>
          <TouchableOpacity
            style={styles.trackPressable}
            activeOpacity={1}
            onPress={(e) => {
              const locationX = e.nativeEvent?.locationX ?? (e.nativeEvent as any)?.offsetX ?? 0;
              if (typeof locationX === 'number' && !isNaN(locationX) && locationX > 0) {
                const pct = Math.min(Math.max(0, locationX / Math.max(1, width - 80)), 1);
                const val = Math.round(pct * 5000);
                if (!isNaN(val)) setExpectedAITasks(val);
              }
            }}
          >
            <View style={styles.trackBase} />
            <View style={[styles.trackFill, { width: `${(((isNaN(expectedAITasks) ? 1000 : expectedAITasks) / 5000) * 100)}%` }]} />
            <View style={[styles.trackThumb, { left: `${(((isNaN(expectedAITasks) ? 1000 : expectedAITasks) / 5000) * 92)}%` }]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sliderSection}>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>Additional Portfolio Units</Text>
          <Text style={styles.sliderValue}>{(isNaN(additionalUnits) ? 5 : additionalUnits)} Units</Text>
        </View>

        <View style={styles.trackContainer}>
          <TouchableOpacity
            style={styles.trackPressable}
            activeOpacity={1}
            onPress={(e) => {
              const locationX = e.nativeEvent?.locationX ?? (e.nativeEvent as any)?.offsetX ?? 0;
              if (typeof locationX === 'number' && !isNaN(locationX) && locationX > 0) {
                const pct = Math.min(Math.max(0, locationX / Math.max(1, width - 80)), 1);
                const val = Math.round(pct * 50);
                if (!isNaN(val)) setAdditionalUnits(val);
              }
            }}
          >
            <View style={styles.trackBase} />
            <View style={[styles.trackFill, { width: `${(((isNaN(additionalUnits) ? 5 : additionalUnits) / 50) * 100)}%` }]} />
            <View style={[styles.trackThumb, { left: `${(((isNaN(additionalUnits) ? 5 : additionalUnits) / 50) * 92)}%` }]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.estimateBox}>
        <Text style={styles.estimateLabel}>ESTIMATED TOTAL COST</Text>
        <Text style={styles.estimateTotal}>
          ₹{calculateEstimatedTotal()}
          <Text style={styles.estimateCycle}>/{isAnnual ? 'yr' : 'mo'}</Text>
        </Text>
        <Text style={styles.estimateDesc}>Pro Plan + Customized Out-of-Bundle AI Credit Pack</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  calculatorCard: {
    borderRadius: 16,
    padding: theme.Spacing.lg,
    marginVertical: 15,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  calculatorTitle: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: theme.Spacing.xs,
  },
  calculatorSub: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 20,
  },
  sliderSection: {
    marginVertical: 12,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  sliderLabel: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.primary,
    fontWeight: '700',
  },
  trackContainer: {
    height: 30,
    justifyContent: 'center',
  },
  trackPressable: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBase: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.Colors.surfaceContainerHigh || '#e5e7eb',
    width: '100%',
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.Colors.primary,
    position: 'absolute',
  },
  trackThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.Colors.surface,
    borderWidth: 2,
    borderColor: theme.Colors.primary,
    position: 'absolute',
    shadowColor: theme.Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  estimateBox: {
    marginTop: 20,
    padding: theme.Spacing.md,
    borderRadius: 16,
    backgroundColor: theme.Colors.primaryContainer,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  estimateTotal: {
    fontSize: theme.Typography.headlineLg.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '600',
    marginVertical: theme.Spacing.xs,
  },
  estimateCycle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  estimateDesc: {
    fontSize: theme.Typography.labelSmall.fontSize - 1,
    color: theme.Colors.onSurfaceVariant,
  },
});
