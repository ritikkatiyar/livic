import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { PressableScale } from '@/src/components/common/motion/PressableScale';
import { useAppTheme } from '@/src/theme/ThemeContext';

const ACTIONS: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap; route: string }[] = [
  { key: 'broadcast', label: 'Broadcast notice', icon: 'campaign', route: '/announcements' },
  { key: 'mess', label: 'Mess menu', icon: 'restaurant-menu', route: '/mess' },
];

/**
 * Daily jobs that otherwise sit behind More, one tap from the phone's home screen.
 * Each shows only when the member can open it.
 */
export function PortfolioQuickActions() {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { canRoute } = usePermissions();
  const actions = ACTIONS.filter((action) => canRoute(action.route));
  if (actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>QUICK ACTIONS</Text>
      <View style={styles.row}>
        {actions.map((action) => (
          <PressableScale
            key={action.key}
            style={styles.chip}
            onPress={() => router.push(action.route as Href)}
            accessibilityLabel={action.label}
          >
            <MaterialIcons name={action.icon} size={18} color={theme.Colors.primary} />
            <Text style={styles.chipLabel}>{action.label}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: theme.Spacing.sm,
      marginTop: theme.Spacing.md,
    },
    heading: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      letterSpacing: 0.2,
      color: theme.Colors.onSurfaceVariant,
    },
    // Wraps rather than scrolls, so a shortcut is never hidden off the edge
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.Spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.xs,
      minHeight: 40,
      paddingHorizontal: theme.Spacing.md,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.Colors.outlineStrong,
      backgroundColor: theme.Colors.surfaceContainerLowest,
    },
    chipLabel: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '500',
      color: theme.Colors.onSurface,
    },
  });
