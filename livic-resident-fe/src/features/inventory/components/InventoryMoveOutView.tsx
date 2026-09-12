import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { verificationItems } from '@/src/features/inventory/mockInventoryData';
import { VerificationCard, SummaryLine } from './InventoryCardComponents';

interface InventoryMoveOutViewProps {
  isDesktop: boolean;
  securityDeposit: number;
  totalDeductions: number;
  netRefund: number;
}

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function InventoryMoveOutView({
  isDesktop,
  securityDeposit,
  totalDeductions,
  netRefund,
}: InventoryMoveOutViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <View style={styles.sectionStack}>
      <View style={[styles.moveBanner, { backgroundColor: theme.Colors.error }]}>
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>MOVE-OUT INSPECTION</Text>
          <Text style={styles.moveBannerTitle}>Alex Rivera</Text>
          <Text style={styles.moveBannerMeta}>Lease #L-7142 · Unit 302-A · Move-out Jul 28, 2026</Text>
        </View>
        <View style={styles.moveOutDatePill}>
          <MaterialIcons name="event" size={16} color={theme.Colors.surfaceContainerLowest} />
          <Text style={styles.moveOutDateText}>Jul 28, 2026</Text>
        </View>
      </View>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          {verificationItems.map(item => <VerificationCard key={item.id} item={item} />)}
        </View>

        <View style={styles.rail}>
          <View style={styles.railHeader}>
            <View style={[styles.railIconCircle, { backgroundColor: theme.Colors.error }]}>
              <MaterialIcons name="receipt-long" size={18} color={theme.Colors.surfaceContainerLowest} />
            </View>
            <Text style={styles.panelTitle}>Settlement</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Security Deposit"  value={formatCurrency(securityDeposit)} bold />
            <View style={styles.railDivider} />
            {verificationItems.filter(i => i.deduction > 0).map(i => (
              <SummaryLine key={i.id} label={i.name} value={`-${formatCurrency(i.deduction)}`} danger />
            ))}
            <SummaryLine label="Total Deductions" value={`-${formatCurrency(totalDeductions)}`} danger bold />
            <View style={styles.railDivider} />
          </View>
          <View style={styles.refundBlock}>
            <Text style={styles.refundLabel}>NET REFUND</Text>
            <Text style={styles.refundAmount}>{formatCurrency(netRefund)}</Text>
          </View>
          <TouchableOpacity style={styles.primaryWideBtn} activeOpacity={0.82}>
            <View
              style={[styles.primaryWideBtnInner, { backgroundColor: theme.Colors.primary }]}
            >
              <Text style={styles.primaryWideBtnText}>Confirm & Settle</Text>
              <MaterialIcons name="send" size={16} color={theme.Colors.surfaceContainerLowest} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ghostWideBtn, styles.ghostWideBtnDanger]}>
            <Text style={[styles.ghostWideBtnText, { color: theme.Colors.error }]}>Dispute Settlement</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  moveBanner: { borderRadius: 22, overflow: 'hidden', minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, gap: theme.Spacing.md },
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
  rail: { flex: 1, minWidth: 260, borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, padding: theme.Spacing.md, gap: 14, overflow: 'hidden' },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  railBody: { gap: 10 },
  railDivider: { height: 1, backgroundColor: theme.Colors.outlineVariant, marginVertical: 2 },
  refundBlock: { backgroundColor: theme.Colors.surfaceContainerLow, borderRadius: 14, padding: 14, gap: 2, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  refundLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.primary, letterSpacing: 0.2 },
  refundAmount: { fontSize: theme.Typography.headlineMedium.fontSize, fontWeight: '600', color: theme.Colors.primary },
  primaryWideBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryWideBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.Spacing.sm, paddingVertical: 14 },
  primaryWideBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
  ghostWideBtn: { borderRadius: 14, borderWidth: 1, borderColor: theme.Colors.outlineVariant, paddingVertical: 13, alignItems: 'center' },
  ghostWideBtnDanger: { borderColor: theme.Colors.error },
  ghostWideBtnText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurfaceVariant },
});
