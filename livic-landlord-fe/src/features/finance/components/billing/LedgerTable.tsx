import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { LedgerEntryResponse } from '../../api/ledger.api';

interface LedgerTableProps {
  ledger: LedgerEntryResponse[];
  properties: any[] | null;
  isLoading: boolean;
  isDesktop: boolean;
  isDark: boolean;
}

export function LedgerTable({
  ledger,
  properties,
  isLoading,
  isDesktop,
  isDark,
}: LedgerTableProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'RENT_CHARGE':
      case 'CHARGE':
        return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'PAYMENT':
        return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'SECURITY_DEPOSIT':
      case 'DEPOSIT':
        return { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
      case 'LATE_FEE':
        return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'ADJUSTMENT':
      default:
        return { text: '#4b5563', bg: '#f3f4f6' };
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  if (!properties || properties.length === 0) {
    return (
      <View style={styles.emptyCardCentered}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcons name="business" size={32} color={theme.Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Property Created Yet</Text>
        <Text style={styles.emptySubtitle}>
          Viewing financial ledgers requires an active property. Create your first property to start logging transactions.
        </Text>
        <TouchableOpacity 
          style={{ borderRadius: 10, overflow: 'hidden' }}
          onPress={() => router.push('/properties/create')}
        >
          <View style={styles.createBtnGradient}>
            <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
            <Text style={styles.createBtnText}>CREATE FIRST PROPERTY</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 80 }} />;
  }

  if (ledger.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <MaterialIcons name="account-balance" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 12 }} />
        <Text style={styles.emptyCardTitle}>No transaction logs found.</Text>
        <Text style={styles.emptyCardSubtitle}>Transactions appear here once rent cycles are generated or payments are made.</Text>
      </View>
    );
  }

  if (isDesktop) {
    return (
      <View style={styles.desktopTableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.5 }]}>DATE</Text>
          <Text style={[styles.th, { flex: 1 }]}>UNIT</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>TENANT</Text>
          <Text style={[styles.th, { flex: 2 }]}>TRANSACTION TYPE</Text>
          <Text style={[styles.th, { flex: 2.5 }]}>DESCRIPTION</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>AMOUNT</Text>
          <Text style={[styles.th, { flex: 1.3, textAlign: 'right' }]}>BALANCE</Text>
        </View>

        {ledger.map((item) => {
          const colors = getTransactionTypeColor(item.transactionType);
          const isPayment = item.amount < 0;
          return (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1.5, fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant }]}>{formatDate(item.createdAt)}</Text>
              <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>{item.unitName}</Text>
              <Text style={[styles.td, { flex: 1.5 }]}>{item.tenantName}</Text>
              <View style={{ flex: 2, flexDirection: 'row' }}>
                <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.pillText, { color: colors.text }]}>
                    {formatTransactionType(item.transactionType)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.td, { flex: 2.5, fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant }]} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[
                styles.td, 
                { 
                  flex: 1.2, 
                  textAlign: 'right', 
                  fontWeight: '600',
                  color: isPayment ? theme.Colors.primary : theme.Colors.error
                }
              ]}>
                {isPayment ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
              </Text>
              <Text style={[
                styles.td, 
                { 
                  flex: 1.3, 
                  textAlign: 'right', 
                  fontWeight: '700',
                  color: theme.Colors.onBackground
                }
              ]}>
                ₹{(item.balance ?? 0).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {ledger.map((item) => {
        const colors = getTransactionTypeColor(item.transactionType);
        const isPayment = item.amount < 0;
        return (
          <View key={item.id} style={styles.mobileCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardUnitText}>{item.unitName}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[
                  styles.cardAmountText, 
                  { color: isPayment ? theme.Colors.primary : theme.Colors.error }
                ]}>
                  {isPayment ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={{ fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 }}>
                  Bal: ₹{(item.balance ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.cardDetailRow}>
              <Text style={styles.cardTenantText}>{item.tenantName}</Text>
              <Text style={styles.cardDateText}>{formatDate(item.createdAt)}</Text>
            </View>

            <View style={[styles.pill, { backgroundColor: colors.bg, alignSelf: 'flex-start', marginTop: theme.Spacing.sm }]}>
              <Text style={[styles.pillText, { color: colors.text, fontSize: theme.Typography.labelSmall.fontSize }]}>
                {formatTransactionType(item.transactionType)}
              </Text>
            </View>

            <Text style={styles.cardDescText}>{item.description}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  emptyCardCentered: {
    padding: theme.Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 40,
    width: '100%',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
  },
  emptyTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: theme.Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.Spacing.lg,
    lineHeight: 20,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: 14,
    gap: theme.Spacing.sm,
    backgroundColor: theme.Colors.primary,
    borderRadius: 10,
  },
  createBtnText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    marginTop: 20,
  },
  emptyCardTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  desktopTableCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    marginTop: theme.Spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  th: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant || theme.Colors.outline,
  },
  td: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '600',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pillText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listContainer: {
    gap: theme.Spacing.md,
    marginTop: theme.Spacing.md,
  },
  mobileCard: {
    borderRadius: 16,
    padding: theme.Spacing.md,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardUnitText: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  cardAmountText: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.Spacing.sm,
  },
  cardTenantText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '600',
  },
  cardDateText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  cardDescText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
