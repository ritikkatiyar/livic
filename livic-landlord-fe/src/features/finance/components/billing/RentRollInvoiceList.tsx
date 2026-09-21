import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PaginatedContainer } from '@/src/components/common/layout/PaginatedContainer';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';

interface RentRollInvoiceListProps {
  invoices: RentCycleResponse[];
  debouncedSearchQuery: string;
  onClearSearch: () => void;
  onPublishSingle: (invoice: RentCycleResponse) => void;
  onOpenCashModal: (invoice: RentCycleResponse) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export function RentRollInvoiceList({
  invoices,
  debouncedSearchQuery,
  onClearSearch,
  onPublishSingle,
  onOpenCashModal,
  page = 0,
  totalPages = 1,
  onPageChange = () => {},
}: RentRollInvoiceListProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (invoices.length === 0) {
    return (
      <EmptyState
        iconName="search-off"
        title="No Invoices Found"
        description={
          debouncedSearchQuery.trim()
            ? `No rent cycles match "${debouncedSearchQuery.trim()}". Try searching with a different name or unit number.`
            : 'No rent cycles found for this billing month.'
        }
        actionText={debouncedSearchQuery.trim() ? "Clear Search" : undefined}
        onAction={debouncedSearchQuery.trim() ? onClearSearch : undefined}
      />
    );
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    const numA = parseInt(a.unitNumber?.replace(/\D/g, '') || '0', 10) || 0;
    const numB = parseInt(b.unitNumber?.replace(/\D/g, '') || '0', 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.tenantName || '').localeCompare(b.tenantName || '');
  });

  return (
    <PaginatedContainer
      data={sortedInvoices}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      keyExtractor={(invoice, idx) => invoice.id || String(idx)}
      renderItem={(invoice) => (
        <GlassCard style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {Boolean(invoice.blockName) && (
                  <View style={styles.blockBadge}>
                    <Text style={styles.blockBadgeText}>{invoice.blockName}</Text>
                  </View>
                )}
                <Text style={styles.invoiceUnit}>Apt {invoice.unitNumber} - {invoice.tenantName}</Text>
              </View>
              <Text style={styles.invoiceIdText}>ID: #{invoice.id?.substring(0, 8)}</Text>
            </View>
            <Text style={styles.invoiceTotal}>₹ {invoice.totalAmount?.toFixed(2)}</Text>
          </View>
          
          <View style={styles.chargesList}>
            {invoice.charges?.map((charge, i) => (
              <View key={i} style={styles.chargeRow}>
                <Text style={styles.chargeDesc}>{charge.description || charge.chargeType}</Text>
                <Text style={styles.chargeAmt}>₹ {charge.amount?.toFixed(2)}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.actionRow}>
            <StatusPill status={invoice.status} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
              {invoice.status === 'PENDING' && (
                <ActionButton
                  label="Publish"
                  icon="send"
                  variant="primary"
                  size="sm"
                  onPress={() => onPublishSingle(invoice)}
                />
              )}
              {invoice.status !== 'PAID' && (
                <ActionButton
                  label="Record Cash"
                  icon="payments"
                  variant="outline"
                  size="sm"
                  onPress={() => onOpenCashModal(invoice)}
                />
              )}
            </View>
          </View>
        </GlassCard>
      )}
    />
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  invoiceList: {
    width: '100%',
    gap: theme.Spacing.md,
  },
  invoiceCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceUnit: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  blockBadge: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  blockBadgeText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  invoiceIdText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  invoiceTotal: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  chargesList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    paddingVertical: theme.Spacing.sm,
    marginVertical: theme.Spacing.sm,
    gap: 6,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chargeDesc: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  chargeAmt: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  recordCashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.24)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  recordCashBtnText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
  },
});
