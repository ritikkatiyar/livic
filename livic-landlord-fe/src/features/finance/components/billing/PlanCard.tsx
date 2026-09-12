import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import type { PlanResponse } from '@/src/features/finance/api/billing.api';

interface PlanCardProps {
  plan: PlanResponse;
  isAnnual: boolean;
  currentPlan: string;
  subscribingPlanKey: string | null;
  isTopUpProcessing: boolean;
  onSubscribe: (planKey: string, price: number) => void;
}

export function PlanCard({
  plan,
  isAnnual,
  currentPlan,
  subscribingPlanKey,
  isTopUpProcessing,
  onSubscribe,
}: PlanCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const isCurrent = currentPlan.toUpperCase() === plan.planKey.toUpperCase();
  const price = isAnnual ? (plan.priceYearly ? plan.priceYearly / 12 : plan.priceMonthly * 0.8) : plan.priceMonthly;

  return (
    <View
      style={[
        styles.planCard,
        plan.planKey === 'PREMIUM' && styles.planCardPro,
        isCurrent && styles.planCardActive,
      ]}
    >
      {isCurrent && (
        <View style={styles.currentPlanRibbon}>
          <Text style={styles.ribbonText}>CURRENT</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.proHeaderRow}>
          <Text style={[styles.planTitle, plan.planKey === 'PREMIUM' && { color: theme.Colors.primary }]}>
            {plan.name || plan.planKey}
          </Text>
          {plan.planKey === 'PREMIUM' && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceDollar}>₹{Math.round(price).toLocaleString('en-IN')}</Text>
          <Text style={styles.priceMonth}>/mo</Text>
        </View>

        <View style={styles.bulletList}>
          {plan.features.slice(0, 6).map((feat, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <MaterialIcons
                name={feat.included ? 'check' : 'close'}
                size={16}
                color={feat.included ? theme.Colors.primaryContainer : '#94a3b8'}
              />
              <Text style={[styles.bulletText, !feat.included && styles.bulletTextDisabled]}>
                {feat.displayLabel}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ActionButton
        title={isCurrent ? 'Active Plan' : `Upgrade to ${plan.name || plan.planKey}`}
        variant={isCurrent ? 'outline' : 'primary'}
        disabled={isCurrent || subscribingPlanKey !== null || isTopUpProcessing}
        loading={subscribingPlanKey === plan.planKey}
        onPress={() => onSubscribe(plan.planKey, plan.priceMonthly)}
        style={{ marginTop: 16, borderRadius: 100 }}
      />
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  planCard: {
    borderRadius: 16,
    padding: theme.Spacing.lg,
    marginVertical: 10,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardPro: {
    borderColor: theme.Colors.primary,
    borderWidth: 2,
  },
  planCardActive: {
    borderColor: theme.Colors.primary,
    borderWidth: 2,
  },
  currentPlanRibbon: {
    position: 'absolute',
    top: 15,
    right: -30,
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: theme.Spacing.xs,
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },
  ribbonText: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.labelSmall.fontSize - 1,
    fontWeight: '600',
    letterSpacing: 1,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.sm,
  },
  planTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  popularBadge: {
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularText: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.labelSmall.fontSize - 2,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceDollar: {
    fontSize: theme.Typography.headlineMd.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  priceMonth: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginLeft: theme.Spacing.xs,
  },
  bulletList: {
    marginBottom: theme.Spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  bulletText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    marginLeft: 10,
  },
  bulletTextDisabled: {
    color: theme.Colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  cardButton: {
    backgroundColor: theme.Colors.surfaceContainerHigh,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  cardButtonPro: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  cardButtonDisabled: {
    backgroundColor: 'transparent',
    borderColor: theme.Colors.outlineVariant,
    opacity: 0.6,
  },
  cardButtonText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  cardButtonTextPro: {
    color: theme.Colors.onPrimary,
  },
});
