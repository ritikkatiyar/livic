import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { PressableScale } from '@/src/components/common/motion/PressableScale';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { withAlpha } from '@/src/theme/colorUtils';

export interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  count?: number | string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function FilterPill({
  label,
  active,
  onPress,
  icon,
  count,
  size = 'md',
  style,
}: FilterPillProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark, size), [theme, isDark, size]);
  const iconSize = size === 'sm' ? 14 : 16;
  // The visible pill stays compact; the touch area reaches the 48dp minimum
  const touchPad = (48 - (size === 'sm' ? 32 : 38)) / 2;
  const hitSlop = { top: touchPad, bottom: touchPad };
  const a11yLabel = count !== undefined ? `${label}, ${count}` : label;

  // Selected is a tint with a tick (not a solid teal fill), so it never reads as a button or the tab bar
  const leadingIcon = icon ?? (active ? 'check' : undefined);
  const renderContent = () => (
    <View style={styles.contentRow}>
      {leadingIcon && (
        <MaterialIcons
          name={leadingIcon}
          size={iconSize}
          color={active ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {count}
          </Text>
        </View>
      )}
    </View>
  );

  if (active) {
    return (
      <PressableScale onPress={onPress} hitSlop={hitSlop} accessibilityState={{ selected: true }} accessibilityLabel={a11yLabel} activeOpacity={0.85} style={[styles.pill, styles.activePill, styles.activeShadow, style]}>
        {renderContent()}
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={onPress} hitSlop={hitSlop} accessibilityState={{ selected: false }} accessibilityLabel={a11yLabel} activeOpacity={0.75} style={[styles.pill, styles.inactivePill, style]}>
      {renderContent()}
    </PressableScale>
  );
}

const createStyles = (theme: any, isDark: boolean, size: 'sm' | 'md') => {
  const height = size === 'sm' ? 32 : 38;
  const paddingHorizontal = size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 12 : 13;

  return StyleSheet.create({
    pill: {
      height,
      borderRadius: theme.Rounded.full,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    activePill: {
      backgroundColor: theme.Colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.Colors.primary,
      paddingHorizontal,
    },
    activeShadow: {
      shadowColor: theme.Colors.outline,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 1,
    },
    inactivePill: {
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineStrong,
      paddingHorizontal,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    textActive: {
      color: theme.Colors.onPrimaryContainer,
      fontWeight: '600',
    },
    textInactive: {
      color: theme.Colors.onSurfaceVariant,
    },
    badge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeActive: {
      backgroundColor: withAlpha(theme.Colors.primary, 0.16),
    },
    badgeInactive: {
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    badgeText: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
    },
    badgeTextActive: {
      color: theme.Colors.onPrimaryContainer,
    },
    badgeTextInactive: {
      color: theme.Colors.onSurfaceVariant,
    },
  });
};

export default FilterPill;
