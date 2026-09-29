import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** @deprecated Glassmorphism deprecated in visual revamp */
  intensity?: number;
  /** @deprecated Glassmorphism deprecated in visual revamp */
  tint?: 'light' | 'dark' | 'default';
}

export function GlassCard({
  children,
  style,
  contentStyle,
}: GlassCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const flattened = StyleSheet.flatten(style);
  const inheritedAlignment: ViewStyle = {};
  if (flattened?.alignItems) inheritedAlignment.alignItems = flattened.alignItems;
  if (flattened?.justifyContent) inheritedAlignment.justifyContent = flattened.justifyContent;

  return (
    <View style={[styles.outerContainer, style]}>
      <View style={[styles.content, inheritedAlignment, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  outerContainer: {
    borderRadius: theme.Rounded.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    // Light mode: a soft shadow lifts white cards off the page. Dark mode relies on the
    // lighter card color instead, since shadows barely show on dark backgrounds.
    ...(isDark
      ? {}
      : {
          shadowColor: theme.Colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 1,
        }),
  },
  content: {
    padding: theme.Spacing.containerPadding,
  },
});

