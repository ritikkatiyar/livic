import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface PublishInvoicesModalProps {
  visible: boolean;
  count: number;
  totalAmount?: number;
  billingMonth?: string;
  isPublishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PublishInvoicesModal({
  visible,
  count,
  totalAmount,
  billingMonth,
  isPublishing,
  onCancel,
  onConfirm,
}: PublishInvoicesModalProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const formattedAmount = totalAmount != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)
    : null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalPopup}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={24} color={theme.Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Publish Invoices</Text>
              <Text style={styles.subtitle}>
                {billingMonth ? `Billing cycle: ${billingMonth}` : 'Confirm invoice publication'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Invoices</Text>
              <Text style={styles.summaryValue}>{count}</Text>
            </View>
            {formattedAmount && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Due</Text>
                <Text style={[styles.summaryValue, { color: theme.Colors.primary }]}>{formattedAmount}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>Notification Channels Dispatched</Text>
          <View style={styles.channelsList}>
            <View style={styles.channelRow}>
              <Ionicons name="phone-portrait-outline" size={18} color="#00897B" />
              <View style={styles.channelContent}>
                <Text style={styles.channelTitle}>Mobile Push</Text>
                <Text style={styles.channelDesc}>Instant push notification to all tenant devices</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#00897B" />
            </View>

            <View style={styles.channelRow}>
              <Ionicons name="mail-outline" size={18} color="#1E88E5" />
              <View style={styles.channelContent}>
                <Text style={styles.channelTitle}>Email Statement</Text>
                <Text style={styles.channelDesc}>Itemized rent statement sent to registered email</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#1E88E5" />
            </View>

            <View style={styles.channelRow}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <View style={styles.channelContent}>
                <Text style={styles.channelTitle}>WhatsApp & SMS</Text>
                <Text style={styles.channelDesc}>Rent due alert sent to primary contact number</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#25D366" />
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={theme.Colors.onSurfaceVariant} />
            <Text style={styles.infoBannerText}>
              Invoices will become live immediately in the resident app for payment.
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isPublishing}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtnWrapper}
              onPress={onConfirm}
              disabled={isPublishing}
            >
              <View style={styles.confirmBtn}>
                {isPublishing ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Publish & Notify</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.5)',
  },
  modalPopup: {
    width: 440,
    maxWidth: '92%',
    padding: theme.Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: theme.Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 104, 117, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  subtitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.md,
    gap: theme.Spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: 100,
  },
  summaryLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  sectionHeader: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  channelsList: {
    gap: 8,
    marginBottom: theme.Spacing.md,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 12,
  },
  channelContent: {
    flex: 1,
  },
  channelTitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  channelDesc: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 10,
    marginBottom: theme.Spacing.lg,
  },
  infoBannerText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: theme.Spacing.md,
    borderRadius: 22,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  confirmBtnWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  confirmBtn: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 150,
    backgroundColor: theme.Colors.primary,
  },
  confirmBtnText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
