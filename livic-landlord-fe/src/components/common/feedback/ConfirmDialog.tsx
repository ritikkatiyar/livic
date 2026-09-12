import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { GlassCard } from '../display/GlassCard';
import { ActionButton } from '../inputs/ActionButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable 
          style={styles.dismissPressable} 
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />
        <View style={styles.contentContainer}>
          <GlassCard style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <ActionButton
                title={cancelText}
                onPress={onCancel}
                variant="outline"
                disabled={loading}
                style={styles.button}
              />
              <ActionButton
                title={confirmText}
                onPress={onConfirm}
                variant={isDestructive ? 'danger' : 'primary'}
                loading={loading}
                style={styles.button}
              />
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.containerPadding,
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.45)',
  },
  dismissPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    zIndex: 1,
  },
  card: {
    padding: theme.Spacing.containerPadding,
    borderRadius: theme.Rounded.lg,
  },
  title: {
    ...theme.Typography.headlineLg,
    color: theme.Colors.onBackground,
    marginBottom: theme.Spacing.stackSm,
  },
  message: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.outline,
    marginBottom: theme.Spacing.stackLg,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.Spacing.stackSm,
  },
  button: {
    flex: 1,
    maxWidth: 140,
    height: 40,
  },
});
