import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAdminTutorial } from '../context/AdminTutorialContext';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

/** Roles that are allowed to see the Admin Setup Checklist. */
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

export const AdminTutorialModal: React.FC = () => {
  const { context } = useAuth();
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isMobile = width < 600;
  const styles = React.useMemo(() => createStyles(theme, isDark, isDesktop, isMobile), [theme, isDark, isDesktop, isMobile]);

  // Only ADMIN and SUPER_ADMIN users should see the setup checklist modal.
  const isAdminRole = ADMIN_ROLES.includes(context?.globalRole as typeof ADMIN_ROLES[number]);
  if (!isAdminRole) {
    return null;
  }

  const {
    steps,
    completedCount,
    totalSteps,
    progressPercent,
    isModalVisible,
    closeModal,
    navigateToStep,
    completeStep,
    uncompleteStep,
    resetTutorial,
  } = useAdminTutorial();

  if (!isModalVisible) return null;

  return (
    <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.kickerRow}>
                <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
                <Text style={styles.kickerText}>ADMIN ONBOARDING GUIDE</Text>
              </View>
              <Text style={styles.modalTitle}>Setup Checklist</Text>
              <Text style={styles.modalSubtitle}>
                Complete these 6 steps to configure your workspace, tenants, leases, and billing.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeModal} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.progressTextGroup}>
              <Text style={styles.statsLabel}>PROGRESS</Text>
              <Text style={styles.statsValue}>
                {completedCount} of {totalSteps} Completed ({progressPercent}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#0072ff', '#00d4ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          {/* Steps Checklist ScrollView */}
          <ScrollView contentContainerStyle={styles.stepsContainer} showsVerticalScrollIndicator={false}>
            {steps.map((step) => {
              const isCompleted = step.isCompleted;
              const isInProgress = step.status === 'IN_PROGRESS';

              return (
                <View
                  key={step.id}
                  style={[
                    styles.stepItem,
                    isCompleted && styles.stepItemCompleted,
                    isInProgress && styles.stepItemActive,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.checkCircle}
                    onPress={() => (isCompleted ? uncompleteStep(step.id) : completeStep(step.id))}
                    activeOpacity={0.7}
                  >
                    {isCompleted ? (
                      <MaterialIcons name="check-circle" size={24} color="#10b981" />
                    ) : (
                      <MaterialIcons
                        name="radio-button-unchecked"
                        size={24}
                        color={isInProgress ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                      />
                    )}
                  </TouchableOpacity>

                  <View style={styles.stepMain}>
                    <View style={[styles.stepHeaderRow, isMobile && styles.stepHeaderRowMobile]}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isCompleted && styles.stepTitleCompleted,
                          isInProgress && styles.stepTitleActive,
                        ]}
                      >
                        {step.stepNumber}. {step.title}
                      </Text>
                      <View style={styles.badgeRow}>
                        {isCompleted && <StatusPill status="SUCCESS" />}
                        {isInProgress && <StatusPill status="PENDING" />}
                        <Text style={styles.timeBadge}>~{step.estimatedMinutes} min</Text>
                      </View>
                    </View>

                    <Text style={styles.stepDesc}>{step.description}</Text>

                    <View style={styles.stepFooterRow}>
                      <ActionButton
                        label={step.actionLabel}
                        icon={step.icon}
                        variant="ghost"
                        size="sm"
                        onPress={() => navigateToStep(step.id)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={resetTutorial} activeOpacity={0.7}>
              <Text style={styles.resetText}>Reset Progress</Text>
            </TouchableOpacity>
            <ActionButton label="Close" variant="outline" size="sm" onPress={closeModal} />
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, isDark: boolean, isDesktop: boolean, isMobile: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? 10 : (theme.Spacing.md || 16),
    },
    modalCard: {
      width: '100%',
      maxWidth: 650,
      maxHeight: '92%',
      borderRadius: isMobile ? 16 : (theme.Rounded.xl || 20),
      borderWidth: 1.5,
      borderColor: theme.Colors.glassStroke,
      padding: isMobile ? 14 : (theme.Spacing.lg || 24),
      overflow: 'hidden',
      backgroundColor: theme.Colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isMobile ? 12 : (theme.Spacing.md || 16),
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.xs || 4,
      marginBottom: 2,
    },
    kickerText: {
      fontSize: theme.Typography.labelSmall?.fontSize || 10,
      fontWeight: '600',
      color: theme.Colors.primary,
      letterSpacing: 1,
    },
    modalTitle: {
      fontSize: isMobile ? 18 : (theme.Typography.headlineMd?.fontSize || 22),
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    modalSubtitle: {
      fontSize: isMobile ? 11 : (theme.Typography.bodyMedium?.fontSize || 13),
      color: theme.Colors.onSurfaceVariant,
      marginTop: 4,
    },
    closeBtn: {
      padding: 6,
      borderRadius: theme.Rounded.sm || 8,
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    statsBar: {
      backgroundColor: theme.Colors.glassFill,
      padding: theme.Spacing.sm || 12,
      borderRadius: theme.Rounded.md || 12,
      marginBottom: theme.Spacing.md || 16,
    },
    progressTextGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    statsLabel: {
      fontSize: theme.Typography.labelSmall?.fontSize || 10,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    statsValue: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      fontWeight: '700',
      color: theme.Colors.primary,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    stepsContainer: {
      gap: theme.Spacing.sm || 12,
      paddingVertical: 4,
    },
    stepItem: {
      flexDirection: 'row',
      gap: isMobile ? 10 : (theme.Spacing.md || 14),
      padding: isMobile ? 12 : (theme.Spacing.md || 16),
      borderRadius: theme.Rounded.lg || 14,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      backgroundColor: theme.Colors.surfaceContainerLowest,
    },
    stepItemCompleted: {
      borderColor: 'rgba(16, 185, 129, 0.3)',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.02)',
    },
    stepItemActive: {
      borderColor: theme.Colors.primary,
      backgroundColor: isDark ? 'rgba(0, 114, 255, 0.1)' : 'rgba(0, 114, 255, 0.03)',
    },
    checkCircle: {
      paddingTop: 2,
    },
    stepMain: {
      flex: 1,
    },
    stepHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepHeaderRowMobile: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 4,
    },
    stepTitle: {
      fontSize: isMobile ? 13 : (theme.Typography.titleMedium?.fontSize || 15),
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    stepTitleCompleted: {
      textDecorationLine: 'line-through',
      color: theme.Colors.onSurfaceVariant,
    },
    stepTitleActive: {
      color: theme.Colors.primary,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.xs || 6,
      flexWrap: 'wrap',
    },
    timeBadge: {
      fontSize: theme.Typography.bodySmall?.fontSize || 11,
      color: theme.Colors.onSurfaceVariant,
      fontWeight: '600',
    },
    stepDesc: {
      fontSize: isMobile ? 11 : (theme.Typography.bodyMedium?.fontSize || 13),
      color: theme.Colors.onSurfaceVariant,
      lineHeight: isMobile ? 16 : 18,
      marginBottom: theme.Spacing.xs || 10,
    },
    stepFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.Spacing.md || 16,
      paddingTop: theme.Spacing.sm || 12,
      borderTopWidth: 1,
      borderTopColor: theme.Colors.outlineVariant,
    },
    resetText: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      color: theme.Colors.error,
      fontWeight: '600',
    },
  });
