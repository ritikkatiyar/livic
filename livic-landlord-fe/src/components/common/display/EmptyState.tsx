import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { GlassCard } from './GlassCard';
import { ActionButton } from '../inputs/ActionButton';
import { withAlpha } from '@/src/theme/colorUtils';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  iconName = 'info-outline',
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <GlassCard style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <MaterialIcons name={iconName} size={48} color={theme.Colors.outline} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onAction && (
        <ActionButton
          title={actionText}
          onPress={onAction}
          variant="outline"
          style={styles.actionButton}
        />
      )}
    </GlassCard>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    padding: theme.Spacing.containerPadding * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.Spacing.stackMd,
    textAlign: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: theme.Rounded.full,
    backgroundColor: withAlpha(theme.Colors.primary, 0.05),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.stackMd,
  },
  title: {
    ...theme.Typography.headlineLg,
    color: theme.Colors.onBackground,
    textAlign: 'center',
    marginBottom: theme.Spacing.stackSm,
  },
  description: {
    ...theme.Typography.labelMuted,
    color: theme.Colors.outline,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: theme.Spacing.stackMd,
  },
  actionButton: {
    minWidth: 150,
  },
});
