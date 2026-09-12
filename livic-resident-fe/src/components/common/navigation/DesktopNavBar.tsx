import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface DesktopNavBarProps {
  onBack?: () => void;
  backText?: string;
  rightContent?: React.ReactNode;
  title?: string;
  activeTab?: string;
  hideTabs?: boolean;
  onNotificationPress?: () => void;
}

export default function DesktopNavBar({ 
  onBack, 
  backText = 'Back',
  rightContent,
  title,
  onNotificationPress
}: DesktopNavBarProps) {
  const { user } = useAuth();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <View style={styles.topbar}>
      {/* Left Area: Back Button */}
      <View style={styles.topbarLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color={theme.Colors.onBackground} />
            <Text style={styles.backButtonTextDesktop}>{backText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right Area: Baseline Notification Bell + Avatar */}
      <View style={styles.topbarRight}>
        {rightContent}

        <TouchableOpacity 
          onPress={onNotificationPress} 
          style={styles.iconBtn} 
          activeOpacity={0.75}
        >
          <MaterialIcons name="notifications-none" size={20} color={theme.Colors.onSurface} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.Colors.primary,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  backButtonTextDesktop: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onBackground,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.Colors.surfaceContainerLowest,
    fontWeight: '700',
    fontSize: theme.Typography.bodyMedium.fontSize,
  },
});
