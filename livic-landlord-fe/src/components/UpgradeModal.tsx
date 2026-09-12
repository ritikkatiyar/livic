import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type UpgradeModalProps = {
  visible: boolean;
  featureName?: string;
  currentPlan?: string;
  message?: string;
  onClose: () => void;
};

export default function UpgradeModal({
  visible,
  featureName = 'this feature',
  currentPlan = 'STARTER',
  message,
  onClose,
}: UpgradeModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/billing');
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={32} color={theme.Colors.primary} />
          </View>

          <Text style={styles.title}>UPGRADE REQUIRED</Text>
          <Text style={styles.subtitle}>
            {message || `Your current ${currentPlan} plan does not include ${featureName}. Upgrade your subscription to unlock unlimited access!`}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Active: {currentPlan}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <MaterialIcons name="arrow-upward" size={18} color={theme.Colors.surfaceContainerLowest} />
            <Text style={styles.upgradeBtnText}>VIEW SUBSCRIPTION PLANS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 28,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
  },
  title: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: theme.Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.bodyMedium.fontSize,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  badgeRow: {
    marginBottom: 20,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  planBadgeText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
  upgradeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.sm,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.Colors.primary,
    marginBottom: 10,
  },
  upgradeBtnText: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeBtn: {
    paddingVertical: 10,
  },
  closeBtnText: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
