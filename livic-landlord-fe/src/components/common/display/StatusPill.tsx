import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface StatusPillProps {
  status: string;
  style?: StyleProp<ViewStyle>;
}

export function StatusPill({ status, style }: StatusPillProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const normalized = (status || '').trim().toUpperCase();

  const getStatusStyles = () => {
    // Status scheme: teal = active/healthy, green = money received, amber = needs attention,
    // red = problem, grey = neutral (incl. vacant, matching the occupancy colors).
    switch (normalized) {
      case 'ACTIVE':
      case 'OCCUPIED':
      case 'SUCCESS':
      case 'APPROVED':
      case 'COMPLETED':
      case 'CONFIGURED':
        return {
          bg: theme.Colors.primaryContainer,
          text: theme.Colors.primary,
          border: theme.Colors.primary,
        };
      case 'PAID':
        return {
          bg: theme.Colors.successContainer,
          text: theme.Colors.success,
          border: theme.Colors.success,
        };
      case 'INACTIVE':
      case 'UNPAID':
      case 'CANCELLED':
      case 'FAILED':
      case 'REJECTED':
        return {
          bg: theme.Colors.errorContainer,
          text: theme.Colors.error,
          border: theme.Colors.error,
        };
      case 'PENDING':
      case 'PARTIALLY_OCCUPIED':
      case 'ENDING_SOON':
      case 'WARNING':
        return {
          bg: theme.Colors.tertiaryContainer,
          text: theme.Colors.tertiary,
          border: theme.Colors.tertiary,
        };
      case 'OVERDUE':
        return {
          bg: theme.Colors.errorContainer,
          text: theme.Colors.error,
          border: theme.Colors.error,
        };
      default:
        return {
          bg: theme.Colors.surfaceContainerLow,
          text: theme.Colors.onSurfaceVariant,
          border: theme.Colors.outline,
        };
    }
  };

  const formatStatus = (val: string) => {
    return (val || '').trim().replace(/_/g, ' ').toUpperCase();
  };

  const { bg, text, border } = getStatusStyles();

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }, style]}>
      <Text style={[styles.text, { color: text }]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    fontFamily: theme.Typography.labelSmall.fontFamily,
  },
});
