import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { type VerificationItem } from '@/src/features/inventory/mockInventoryData';
import { VerificationCard, SummaryLine } from './InventoryCardComponents';
import { formatCurrency } from '@/src/utils/formatters';

interface InventoryMoveOutViewProps {
  items?: VerificationItem[];
  leaseId?: string;
  isDesktop: boolean;
  securityDeposit: number;
  totalDeductions: number;
  netRefund: number;
  onRefresh?: () => void;
}

export function InventoryMoveOutView({
  items = [],
  leaseId,
  isDesktop,
  securityDeposit,
  totalDeductions,
  netRefund,
}: InventoryMoveOutViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const hasItems = items.length > 0;

  return (
    <View style={styles.sectionStack}>
      <View style={styles.moveBanner}>
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>MOVE-OUT INSPECTION</Text>
          <Text style={styles.moveBannerTitle}>Return Verification & Settlement</Text>
          <Text style={styles.moveBannerMeta}>{leaseId ? `Lease #${leaseId}` : 'Inspect return conditions and compute deductions'}</Text>
        </View>
        <View style={styles.moveOutDatePill}>
          <MaterialIcons name="event" size={16} color={theme.Colors.surfaceContainerLowest} />
          <Text style={styles.moveOutDateText}>{hasItems ? 'Inspection Active' : 'No Assets Bound'}</Text>
        </View>
      </View>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          {!hasItems ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="receipt-long" size={32} color={theme.Colors.error} />
              </View>
              <Text style={styles.emptyTitle}>No Move-In Assets Bound to this Lease</Text>
              <Text style={styles.emptySubtitle}>
                No physical items were assigned to this lease on move-in. Full deposit refund is ready for settlement.
              </Text>
            </View>
          ) : (
            items.map((item) => <VerificationCard key={item.id} item={item} />)
          )}
        </View>

        <View style={styles.rail}>
          <View style={styles.railHeader}>
            <View style={styles.railIconCircle}>
              <MaterialIcons name="receipt-long" size={18} color={theme.Colors.surfaceContainerLowest} />
            </View>
            <Text style={styles.panelTitle}>Settlement</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Security Deposit" value={formatCurrency(securityDeposit)} bold />
            <View style={styles.railDivider} />
            {items.filter(i => (i.deduction || 0) > 0).map(i => (
              <SummaryLine key={i.id} label={i.name} value={`-${formatCurrency(i.deduction)}`} danger />
            ))}
            <SummaryLine label="Total Deductions" value={`-${formatCurrency(totalDeductions)}`} danger bold />
            <View style={styles.railDivider} />
          </View>
          <View style={styles.refundBlock}>
            <Text style={styles.refundLabel}>NET REFUND</Text>
            <Text style={styles.refundAmount}>{formatCurrency(netRefund)}</Text>
          </View>
          <ActionButton
            label="Confirm & Settle"
            icon="send"
            variant="primary"
            size="md"
            onPress={() => {}}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  moveBanner: { borderRadius: 16, backgroundColor: theme.Colors.error, minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, gap: theme.Spacing.md },
  moveBannerContent: { flex: 1 },
  moveBannerKicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6 },
  moveBannerTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest, marginTop: theme.Spacing.xs },
  moveBannerMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: 'rgba(255,255,255,0.8)', marginTop: theme.Spacing.xs },
  moveOutDatePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: theme.Spacing.sm, borderRadius: 12 },
  moveOutDateText: { color: theme.Colors.surfaceContainerLowest, fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  workflowGrid: { gap: 14 },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1.9, gap: 12 },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },

  emptyCard: {
    borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest, padding: 40, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.xs, backgroundColor: theme.Colors.errorContainer },
  emptyTitle: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  emptySubtitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 360, lineHeight: 18 },

  rail: { flex: 1, minWidth: 260, borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, padding: theme.Spacing.md, gap: 14 },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.error },
  railBody: { gap: 10 },
  railDivider: { height: 1, backgroundColor: theme.Colors.outlineVariant, marginVertical: 2 },
  refundBlock: { backgroundColor: theme.Colors.surfaceContainerLow, borderRadius: 14, padding: 14, gap: 2, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  refundLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.primary, letterSpacing: 0.2 },
  refundAmount: { fontSize: theme.Typography.headlineMedium.fontSize, fontWeight: '600', color: theme.Colors.primary },
  primaryWideBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryWideBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.Spacing.sm, paddingVertical: 14 },
  primaryWideBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
});
