import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  /** Renders the row in the error color; keep these last in the list. */
  destructive?: boolean;
}

interface ActionMenuSheetProps {
  visible: boolean;
  title?: string;
  items: ActionMenuItem[];
  onClose: () => void;
}

/**
 * Bottom sheet listing secondary actions for an item (e.g. a property or lease card).
 * Keeps rarely used and destructive actions off the card itself.
 */
export function ActionMenuSheet({ visible, title, items, onClose }: ActionMenuSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={styles.handle} />
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {items.map((item) => {
            const color = item.destructive ? theme.Colors.error : theme.Colors.onSurface;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.row}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              >
                <MaterialIcons name={item.icon} size={22} color={item.destructive ? theme.Colors.error : theme.Colors.onSurfaceVariant} />
                <Text style={[styles.rowLabel, { color }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.Colors.scrim,
    },
    sheet: {
      backgroundColor: theme.Colors.surfaceContainer,
      borderTopLeftRadius: theme.Rounded.xl,
      borderTopRightRadius: theme.Rounded.xl,
      paddingTop: theme.Spacing.sm,
      paddingHorizontal: theme.Spacing.sm,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.Colors.outline,
      marginBottom: theme.Spacing.sm,
    },
    title: {
      fontSize: theme.Typography.titleMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      paddingHorizontal: theme.Spacing.md,
      paddingVertical: theme.Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.md,
      minHeight: 52,
      paddingHorizontal: theme.Spacing.md,
      borderRadius: theme.Rounded.md,
    },
    rowLabel: {
      fontSize: theme.Typography.bodyLarge.fontSize,
      fontWeight: '500',
    },
  });
