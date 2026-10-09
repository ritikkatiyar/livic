import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme, type ThemeMode } from '@/src/theme/ThemeContext';

const MODES: { mode: ThemeMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { mode: 'system', label: 'System', icon: 'brightness-auto' },
  { mode: 'light', label: 'Light', icon: 'light-mode' },
  { mode: 'dark', label: 'Dark', icon: 'dark-mode' },
];

/**
 * Theme choice as three named options, so it is clear which one is on and "follow the phone" can
 * always be chosen again (a single sun/moon toggle hid that, and read as either state or target).
 */
export function ThemeModeControl({ onSelect }: { onSelect: (mode: ThemeMode) => void }) {
  const { theme, mode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Theme">
      {MODES.map((option) => {
        const selected = mode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => {
              if (!selected) onSelect(option.mode);
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Theme: ${option.label}`}
          >
            <MaterialIcons
              name={option.icon}
              size={16}
              color={selected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
            />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    group: {
      flexDirection: 'row',
      padding: 3,
      gap: 3,
      borderRadius: theme.Rounded.full,
      borderWidth: 1,
      borderColor: theme.Colors.outlineStrong,
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    segment: {
      flex: 1,
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: theme.Rounded.full,
    },
    segmentSelected: {
      backgroundColor: theme.Colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.Colors.primary,
    },
    label: {
      flexShrink: 1,
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '500',
      color: theme.Colors.onSurfaceVariant,
    },
    labelSelected: {
      fontWeight: '600',
      color: theme.Colors.onPrimaryContainer,
    },
  });
