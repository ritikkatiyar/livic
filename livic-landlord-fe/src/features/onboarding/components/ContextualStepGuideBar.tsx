import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAdminTutorial } from '../context/AdminTutorialContext';
import { AdminStepId } from '../types/adminTutorial.types';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import FilterPill from '@/src/components/common/inputs/FilterPill';

interface ContextualStepGuideBarProps {
  stepId: AdminStepId;
  customHint?: string;
  onQuickAction?: (actionKey: string) => void;
}

export const ContextualStepGuideBar: React.FC<ContextualStepGuideBarProps> = ({
  stepId,
  customHint,
  onQuickAction,
}) => {
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isSmallMobile = width < 480;
  const styles = React.useMemo(() => createStyles(theme, isDark, isDesktop, isSmallMobile), [theme, isDark, isDesktop, isSmallMobile]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const { steps, completeStep, isTutorialCompleted, isDismissed, openModal, reopenTutorial } = useAdminTutorial();

  const step = steps.find((s) => s.id === stepId);

  if (isTutorialCompleted || !step || step.isCompleted) {
    return null;
  }

  // If dismissed, offer a restore button so user can bring it back easily
  if (isDismissed) {
    return (
      <View style={styles.restoreContainer}>
        <TouchableOpacity style={styles.restorePill} onPress={reopenTutorial} activeOpacity={0.8}>
          <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
          <Text style={styles.restoreText}>
            Resume Guide Step {step.stepNumber}: {step.title}
          </Text>
          <MaterialIcons name="arrow-forward" size={12} color={theme.Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  const hintText = customHint || step.targetHint || step.description;
  const hasSubSteps = step.subSteps && step.subSteps.length > 0;
  const hasQuickOptions = step.quickOptions && step.quickOptions.length > 0;

  const handleActionClick = (key: string) => {
    setActiveKeys((prev) => {
      let next = [...prev];
      if (key === 'mode_global') {
        next = next.filter((k) => k !== 'mode_custom');
      } else if (key === 'mode_custom') {
        next = next.filter((k) => k !== 'mode_global');
      }
      if (!next.includes(key)) {
        next.push(key);
      }
      return next;
    });

    if (onQuickAction) {
      onQuickAction(key);
    }
  };

  return (
    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.container}>
      <View style={[styles.inner, !isDesktop && styles.innerMobile]}>
        <View style={styles.topInfoRow}>
          <View style={styles.iconBox}>
            <MaterialIcons name="auto-awesome" size={18} color={theme.Colors.primary} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.kicker}>INTERACTIVE GUIDE Â· STEP {step.stepNumber} OF 6</Text>
              <Text style={styles.title}>{step.title}</Text>
            </View>
            <Text style={styles.hintText}>{hintText}</Text>
          </View>
        </View>

        <View style={[styles.actions, !isDesktop && styles.actionsMobile]}>
          {hasSubSteps && (
            <ActionButton
              label={isExpanded ? 'Hide Steps' : `Sub-steps (${step.subSteps?.length})`}
              icon={isExpanded ? 'expand-less' : 'format-list-numbered'}
              variant="outline"
              size="sm"
              onPress={() => setIsExpanded(!isExpanded)}
            />
          )}

          <ActionButton
            label="Mark Complete"
            icon="check"
            variant="primary"
            size="sm"
            onPress={() => completeStep(stepId)}
          />

          <ActionButton
            icon="format-list-bulleted"
            variant="outline"
            size="sm"
            onPress={openModal}
          />
        </View>
      </View>

      {/* Global FilterPills for Interactive Quick Options */}
      {hasQuickOptions && (
        <View style={styles.quickOptionsRow}>
          <Text style={styles.quickOptionsLabel}>QUICK CHOICES & AUTOMATION:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {step.quickOptions?.map((opt) => (
              <FilterPill
                key={opt.key}
                label={opt.label}
                active={activeKeys.includes(opt.key)}
                onPress={() => handleActionClick(opt.key)}
                icon={opt.icon}
                size="sm"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Expandable Detailed Sub-Steps Drawer */}
      {isExpanded && hasSubSteps && (
        <View style={styles.subStepsContainer}>
          {step.subSteps?.map((sub, idx) => (
            <View key={sub.id} style={styles.subStepCard}>
              <View style={styles.subStepBadge}>
                <Text style={styles.subStepBadgeText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.subStepHeaderRow}>
                  <Text style={styles.subStepTitle}>{sub.title}</Text>
                  {sub.icon && <MaterialIcons name={sub.icon} size={14} color={theme.Colors.primary} />}
                </View>
                <Text style={styles.subStepDetail}>{sub.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </BlurView>
  );
};

const createStyles = (theme: any, isDark: boolean, isDesktop: boolean, isSmallMobile: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: theme.Rounded.lg || 16,
      borderWidth: 1.5,
      borderColor: theme.Colors.glassStroke,
      backgroundColor: theme.Colors.glassFill,
      overflow: 'hidden',
      marginBottom: theme.Spacing.md || 16,
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
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.Spacing.md || 14,
      gap: theme.Spacing.sm || 12,
    },
    innerMobile: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 10,
    },
    topInfoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.Spacing.sm || 12,
      flex: 1,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDark ? 'rgba(0, 114, 255, 0.25)' : 'rgba(0, 114, 255, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    textContainer: {
      flex: 1,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.Spacing.xs || 8,
      marginBottom: 2,
    },
    kicker: {
      fontSize: theme.Typography.labelSmall?.fontSize || 9,
      fontWeight: '600',
      color: theme.Colors.primary,
      letterSpacing: 0.6,
    },
    title: {
      fontSize: theme.Typography.titleSmall?.fontSize || 13,
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    hintText: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      color: theme.Colors.onSurfaceVariant,
      lineHeight: 16,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.xs || 6,
    },
    actionsMobile: {
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      width: '100%',
      paddingTop: 4,
    },
    quickOptionsRow: {
      borderTopWidth: 1,
      borderTopColor: theme.Colors.outlineVariant,
      paddingHorizontal: theme.Spacing.md || 14,
      paddingVertical: theme.Spacing.xs || 8,
      gap: 6,
    },
    quickOptionsLabel: {
      fontSize: theme.Typography.labelSmall?.fontSize || 9,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    pillsScroll: {
      gap: theme.Spacing.xs || 8,
      alignItems: 'center',
    },
    subStepsContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.Colors.outlineVariant,
      padding: theme.Spacing.sm || 12,
      gap: theme.Spacing.xs || 8,
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    subStepCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.Spacing.sm || 10,
      padding: theme.Spacing.sm || 10,
      borderRadius: theme.Rounded.md || 10,
      backgroundColor: theme.Colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
    },
    subStepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    subStepBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.Colors.onPrimary || '#ffffff',
    },
    subStepHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    subStepTitle: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    subStepDetail: {
      fontSize: theme.Typography.bodySmall?.fontSize || 11,
      color: theme.Colors.onSurfaceVariant,
      lineHeight: 15,
    },
  });
