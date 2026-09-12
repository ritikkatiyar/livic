import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface WalletCardProps {
  currentPlan: string;
  remainingCredits: number;
  loading?: boolean;
}

export function WalletCard({ currentPlan, remainingCredits, loading = false }: WalletCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.walletStatusCard}>
      <View style={styles.walletStatusGradient}>
        <View style={styles.walletHeader}>
          <View>
            <Text style={styles.walletLabel}>ACTIVE SUBSCRIPTION TIER</Text>
            {loading ? (
              <View style={{ height: 24, width: 140, borderRadius: 6, backgroundColor: theme.Colors.surfaceContainerHigh, opacity: 0.6, marginTop: 4 }} />
            ) : (
              <Text style={styles.walletValue}>{currentPlan}</Text>
            )}
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.activeBadge}>{loading ? '...' : 'ACTIVE'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.walletFooter}>
          <View>
            <Text style={styles.walletLabel}>PREPAID AI CREDIT BALANCE</Text>
            {loading ? (
              <View style={{ height: 24, width: 100, borderRadius: 6, backgroundColor: theme.Colors.surfaceContainerHigh, opacity: 0.6, marginTop: 4 }} />
            ) : (
              <Text style={styles.creditValue}>
                {remainingCredits.toLocaleString()} <Text style={styles.creditUnit}>AI Credits</Text>
              </Text>
            )}
          </View>
          <Ionicons name="wallet-outline" size={32} color={theme.Colors.primary} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  walletStatusCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    marginVertical: 15,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  walletStatusGradient: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: theme.Spacing.xs,
  },
  walletValue: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  activeBadge: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.Colors.outlineVariant,
    marginVertical: 15,
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditValue: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
  },
  creditUnit: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.primary,
    fontWeight: '500',
  },
});
