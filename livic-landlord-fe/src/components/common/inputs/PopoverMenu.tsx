import React, { useEffect, useRef, useState } from 'react';
import { Animated, GestureResponderEvent, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { Motion, useReducedMotion } from '@/src/theme/motion';
import { useAppChromeInsets } from '@/src/components/common/layout/AppChrome';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  /** Renders the row in the error color; keep these last in the list. */
  destructive?: boolean;
}

/** Where the menu opens: the point that was tapped, in window coordinates. */
export type MenuAnchor = { x: number; y: number };

/** The tap point of a press, to pass as a menu's anchor. Presses without a position open at the top left. */
export const anchorFromPress = (e?: GestureResponderEvent): MenuAnchor => ({
  x: e?.nativeEvent?.pageX ?? 0,
  y: e?.nativeEvent?.pageY ?? 0,
});

interface PopoverMenuProps {
  /** Null keeps the menu closed. */
  anchor: MenuAnchor | null;
  items: ActionMenuItem[];
  onClose: () => void;
}

const EDGE = 12;
const GAP = 6;

/**
 * A small menu that opens beside the tapped ⋮, like a desktop context menu: below and to the
 * left of the tap, kept on screen, and above the tap when there is no room below.
 */
export function PopoverMenu({ anchor, items, onClose }: PopoverMenuProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The floating bottom bar (and Livi) count as off-limits: the menu never sits on top of them
  const chrome = useAppChromeInsets();
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const appear = useRef(new Animated.Value(0)).current;

  // Measure afresh on every open, then grow in from the tapped corner
  useEffect(() => {
    if (!anchor) {
      setSize(null);
      appear.setValue(0);
    }
  }, [anchor, appear]);

  useEffect(() => {
    if (!anchor || !size) return;
    Animated.timing(appear, {
      toValue: 1,
      duration: reduceMotion ? 0 : Motion.duration.quick,
      easing: Motion.easeOut,
      useNativeDriver: Motion.nativeDriver,
    }).start();
  }, [anchor, size, appear, reduceMotion]);

  let position = { left: 0, top: 0 };
  let opensUpward = false;
  if (anchor && size) {
    const left = Math.min(Math.max(anchor.x - size.width + GAP * 3, EDGE), windowWidth - size.width - EDGE);
    const bottomLimit = windowHeight - Math.max(chrome.bottom + GAP, insets.bottom, EDGE);
    opensUpward = anchor.y + GAP + size.height > bottomLimit;
    const top = opensUpward ? Math.max(anchor.y - GAP - size.height, insets.top + EDGE) : anchor.y + GAP;
    position = { left, top };
  }

  return (
    <Modal transparent visible={anchor !== null} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      <Animated.View
        accessibilityRole="menu"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (!size || size.width !== width || size.height !== height) setSize({ width, height });
        }}
        style={[
          styles.menu,
          position,
          {
            // Hidden until measured, so it never flashes in the corner
            opacity: size ? appear : 0,
            transform: reduceMotion
              ? []
              : [
                  { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [opensUpward ? 4 : -4, 0] }) },
                  { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
          },
        ]}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.key}>
          {/* A rule above the first destructive action, so it is never one slip away from the others */}
          {item.destructive && index > 0 && !items[index - 1].destructive && <View style={styles.divider} />}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            accessibilityRole="menuitem"
            accessibilityLabel={item.label}
            onPress={() => {
              onClose();
              item.onPress();
            }}
          >
            <MaterialIcons
              name={item.icon}
              size={18}
              color={item.destructive ? theme.Colors.error : theme.Colors.onSurfaceVariant}
            />
            <Text style={[styles.rowLabel, item.destructive && { color: theme.Colors.error }]}>{item.label}</Text>
          </TouchableOpacity>
          </React.Fragment>
        ))}
      </Animated.View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    menu: {
      position: 'absolute',
      minWidth: 200,
      maxWidth: 280,
      paddingVertical: theme.Spacing.xs,
      borderRadius: theme.Rounded.md,
      borderWidth: 1,
      // Light: a white sheet lifted by its shadow; dark: a raised surface with a visible edge
      borderColor: isDark ? theme.Colors.outline : theme.Colors.outlineVariant,
      backgroundColor: isDark ? theme.Colors.surfaceContainerHigh : theme.Colors.surfaceContainerLowest,
      shadowColor: theme.Colors.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.sm,
      minHeight: 48,
      paddingHorizontal: theme.Spacing.md,
    },
    divider: {
      height: 1,
      marginVertical: theme.Spacing.xs,
      backgroundColor: theme.Colors.outlineVariant,
    },
    rowLabel: {
      flexShrink: 1,
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '500',
      color: theme.Colors.onSurface,
    },
  });
