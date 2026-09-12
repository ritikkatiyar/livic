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
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

const createStyles = (theme: any) => StyleSheet.create({
  outerContainer: {
    borderRadius: theme.Rounded.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  content: {
    padding: theme.Spacing.containerPadding,
  },
});

