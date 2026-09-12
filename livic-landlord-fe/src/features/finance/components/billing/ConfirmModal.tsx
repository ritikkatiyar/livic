import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalPopup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmBtnWrapper} onPress={onConfirm}>
              <View style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
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
    width: 400,
    maxWidth: '90%',
    padding: theme.Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  title: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: 12,
  },
  message: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: theme.Spacing.lg,
    fontWeight: '500',
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
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.error,
  },
  confirmBtnText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
