import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';

interface RecordCashModalProps {
  visible: boolean;
  selectedInvoice: RentCycleResponse | null;
  cashAmount: string;
  cashNote: string;
  isRecording: boolean;
  receiptSuccess: boolean;
  setCashAmount: (val: string) => void;
  setCashNote: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function RecordCashModal({
  visible,
  selectedInvoice,
  cashAmount,
  cashNote,
  isRecording,
  receiptSuccess,
  setCashAmount,
  setCashNote,
  onClose,
  onConfirm,
}: RecordCashModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBlur}>
          <View style={styles.modalContent}>
            {!receiptSuccess ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Cash Settlement</Text>
                  <TouchableOpacity onPress={onClose}>
                    <MaterialIcons name="close" size={24} color={theme.Colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Record a direct cash settlement for Apt {selectedInvoice?.unitNumber} ({selectedInvoice?.tenantName})
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cash Amount Received (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={cashAmount}
                    onChangeText={setCashAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Settlement Note</Text>
                  <TextInput
                    style={styles.textInput}
                    value={cashNote}
                    onChangeText={setCashNote}
                    placeholder="Add a payment note"
                  />
                </View>

                <ActionButton
                  title="CONFIRM CASH COLLECTION"
                  onPress={onConfirm}
                  loading={isRecording}
                  style={{ marginTop: theme.Spacing.md }}
                />
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <MaterialIcons name="check-circle" size={48} color="#16a34a" />
                </View>
                <Text style={styles.successTitle}>Payment Confirmed!</Text>
                <Text style={styles.successSubtitle}>
                  Direct cash transaction successfully completed and reconciled.
                </Text>

                <View style={styles.checklistReceipt}>
                  <View style={styles.checkItem}>
                    <MaterialIcons name="check" size={16} color="#16a34a" />
                    <Text style={styles.checkText}>Signature transaction generated</Text>
                  </View>
                  <View style={styles.checkItem}>
                    <MaterialIcons name="check" size={16} color="#16a34a" />
                    <Text style={styles.checkText}>Ledger accounts balanced & updated</Text>
                  </View>
                  <View style={styles.checkItem}>
                    <MaterialIcons name="check" size={16} color="#16a34a" />
                    <Text style={styles.checkText}>Receipt notification dispatched</Text>
                  </View>
                </View>

                <View style={styles.receiptMeta}>
                  <Text style={styles.metaLabel}>Settled Amount:</Text>
                  <Text style={styles.metaValue}>₹ {parseFloat(cashAmount || '0').toFixed(2)}</Text>
                </View>

                <ActionButton
                  title="CLOSE"
                  onPress={onClose}
                  style={{ marginTop: theme.Spacing.lg, width: '100%' }}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.5)',
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  modalSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: theme.Spacing.md,
  },
  inputLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    color: theme.Colors.onSurface,
    paddingHorizontal: theme.Spacing.md,
    fontSize: theme.Typography.bodyMedium.fontSize,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
  },
  successTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: theme.Spacing.sm,
  },
  successSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.Spacing.lg,
    lineHeight: 20,
  },
  checklistReceipt: {
    width: '100%',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: theme.Spacing.md,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    gap: theme.Spacing.sm,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  checkText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.outlineVariant,
    paddingBottom: 12,
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '600',
  },
});
