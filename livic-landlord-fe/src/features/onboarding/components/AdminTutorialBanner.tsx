import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAdminTutorial } from '../context/AdminTutorialContext';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

/** Roles that are allowed to see the Admin Setup Checklist. */
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

export const AdminTutorialBanner: React.FC = () => {
  const { context } = useAuth();
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isMobile = width < 600;
  const styles = React.useMemo(() => createStyles(theme, isDark, isDesktop, isMobile), [theme, isDark, isDesktop, isMobile]);

  // Only ADMIN and SUPER_ADMIN users should see the setup checklist.
  const isAdminRole = ADMIN_ROLES.includes(context?.globalRole as typeof ADMIN_ROLES[number]);
  if (!isAdminRole) {
    return null;
  }

  const {
    activeStep,
    completedCount,
    totalSteps,
    progressPercent,
    isTutorialCompleted,
    isDismissed,
    openModal,
    navigateToStep,
    dismissTutorial,
    reopenTutorial,
  } = useAdminTutorial();

  if (isTutorialCompleted) {
    return null;
  }

  // If dismissed by accident, render compact "Resume Setup Guide" glass pill
  if (isDismissed) {
    return (
      <View style={styles.restoreContainer}>
        <TouchableOpacity style={styles.restorePill} onPress={reopenTutorial} activeOpacity={0.8}>
          <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
          <Text style={styles.restoreText}>
            Resume Admin Setup Guide ({completedCount}/{totalSteps} Steps)
          </Text>
          <MaterialIcons name="arrow-forward" size={12} color={theme.Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  if (!activeStep) {
    return null;
  }

  return (
    <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.card}>
      <LinearGradient
        colors={isDark ? ['rgba(0, 114, 255, 0.15)', 'rgba(0, 212, 255, 0.05)'] : ['rgba(0, 114, 255, 0.08)', 'rgba(0, 212, 255, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
          <View style={styles.titleContainer}>
            <View style={styles.badgeWrapper}>
              <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
              <Text style={styles.badgeText}>QUICK-START GUIDE</Text>
            </View>
            <Text style={styles.mainTitle}>Admin Setup Checklist</Text>
          </View>
          
          <View style={[styles.rightHeaderActions, isMobile && styles.rightHeaderActionsMobile]}>
            <Text style={styles.progressCounter}>
              <Text style={styles.progressBold}>{completedCount}</Text> / {totalSteps} Steps ({progressPercent}%)
            </Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={dismissTutorial} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color={theme.Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <LinearGradient
            colors={['#0072ff', '#00d4ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>

        {/* Active Step Content */}
        <View style={[styles.contentRow, !isDesktop && styles.contentRowMobile]}>
          <View style={styles.stepInfo}>
            <View style={styles.iconCircle}>
              <MaterialIcons name={activeStep.icon} size={20} color={theme.Colors.primary} />
            </View>
            <View style={styles.stepTextWrapper}>
              <Text style={styles.stepKicker}>NEXT STEP {activeStep.stepNumber} OF {totalSteps}</Text>
              <Text style={styles.stepTitle}>{activeStep.title}</Text>
              <Text style={styles.stepSubtitle}>{activeStep.subtitle}</Text>
            </View>
          </View>

          <View style={[styles.actionsRow, !isDesktop && styles.actionsRowMobile]}>
            <ActionButton
              label="All Steps"
              icon="format-list-bulleted"
              variant="outline"
              size="sm"
              onPress={openModal}
            />
            <ActionButton
              label={activeStep.actionLabel}
              icon="arrow-forward"
              iconPosition="right"
              variant="primary"
              size="sm"
              onPress={() => navigateToStep(activeStep.id)}
            />
          </View>
        </View>
      </LinearGradient>
    </BlurView>
  );
};

const createStyles = (theme: any, isDark: boolean, isDesktop: boolean, isMobile: boolean) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.Rounded.lg || 16,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: theme.Colors.glassStroke,
      marginBottom: theme.Spacing.lg || 20,
      width: '100%',
    },
    restoreContainer: {
      marginBottom: theme.Spacing.md || 16,
      alignItems: 'flex-start',
    },
    restorePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.xs || 8,
      paddingHorizontal: theme.Spacing.md || 14,
      paddingVertical: theme.Spacing.xs || 8,
      borderRadius: theme.Rounded.full || 100,
      borderWidth: 1.5,
      borderColor: theme.Colors.glassStroke,
      backgroundColor: theme.Colors.glassFill,
    },
    restoreText: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    gradientBg: {
      padding: isMobile ? 14 : (theme.Spacing.md || 18),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.Spacing.sm || 12,
    },
    headerRowMobile: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
    },
    titleContainer: {
      gap: 2,
    },
    badgeWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      fontSize: theme.Typography.labelSmall?.fontSize || 10,
      fontWeight: '600',
      letterSpacing: 1,
      color: theme.Colors.primary,
    },
    mainTitle: {
      fontSize: isMobile ? 16 : (theme.Typography.headlineSm?.fontSize || 18),
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    rightHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.sm || 12,
    },
    rightHeaderActionsMobile: {
      width: '100%',
      justifyContent: 'space-between',
    },
    progressCounter: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
    },
    progressBold: {
      color: theme.Colors.primary,
      fontWeight: '600',
    },
    dismissBtn: {
      padding: 4,
      borderRadius: theme.Rounded.sm || 8,
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      marginBottom: theme.Spacing.sm || 14,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    contentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.Spacing.md || 16,
    },
    contentRowMobile: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 12,
    },
    stepInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.sm || 12,
      flex: 1,
      width: '100%',
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(0, 114, 255, 0.2)' : 'rgba(0, 114, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepTextWrapper: {
      flex: 1,
    },
    stepKicker: {
      fontSize: theme.Typography.labelSmall?.fontSize || 10,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    stepTitle: {
      fontSize: theme.Typography.titleSmall?.fontSize || 14,
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    stepSubtitle: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.Spacing.xs || 8,
      alignItems: 'center',
    },
    actionsRowMobile: {
      width: '100%',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
    },
  });
