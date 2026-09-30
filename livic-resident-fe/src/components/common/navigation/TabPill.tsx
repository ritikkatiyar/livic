import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { AppTheme } from '@/src/theme/ThemeContext';
import { PILL_BORDER, PILL_HEIGHT, PILL_ITEM_HEIGHT, PILL_MAX_WIDTH, PILL_PADDING } from './bottomDock';

export interface TabPillItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

const ITEM_GAP = 2;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * The bottom bar's pill. One capsule marks the selected tab and slides to the next when it changes;
 * each tab's icon and label turn white as the capsule passes under them, so colour never runs ahead of it.
 */
export function TabPill({ items }: { items: TabPillItem[] }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const reduceMotion = useReducedMotion();

  const activeIndex = items.findIndex((item) => item.active);
  const position = useRef(new Animated.Value(Math.max(activeIndex, 0))).current;
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    if (activeIndex < 0) return;
    if (reduceMotion) {
      position.setValue(activeIndex);
      return;
    }
    // Near-critically damped: arrives in about a quarter of a second without bouncing past the tab
    Animated.spring(position, {
      toValue: activeIndex,
      damping: 34,
      stiffness: 340,
      mass: 0.9,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [activeIndex, position, reduceMotion]);

  // Until the row is measured the capsule can't be placed, so the selected tab paints its own background
  const itemWidth = rowWidth > 0 ? (rowWidth - ITEM_GAP * (items.length - 1)) / items.length : 0;
  const isMeasured = itemWidth > 0;

  return (
    <View style={styles.pill} accessibilityRole="tablist">
      <View style={styles.row} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        {isMeasured && activeIndex >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.capsule,
              { width: itemWidth, transform: [{ translateX: Animated.multiply(position, itemWidth + ITEM_GAP) }] },
            ]}
          />
        ) : null}

        {items.map((item, index) => {
          const nearness = { inputRange: [index - 1, index, index + 1], extrapolate: 'clamp' as const };
          const selectedOpacity = isMeasured ? position.interpolate({ ...nearness, outputRange: [0, 1, 0] }) : item.active ? 1 : 0;
          const restingOpacity = isMeasured ? position.interpolate({ ...nearness, outputRange: [1, 0, 1] }) : item.active ? 0 : 1;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.item, !isMeasured && item.active && styles.itemSelectedFallback]}
              onPress={item.onPress}
              activeOpacity={0.75}
              accessibilityRole="tab"
              aria-selected={item.active}
              accessibilityLabel={item.accessibilityLabel ?? item.label}
            >
              <Animated.View style={[styles.itemContent, { opacity: restingOpacity }]}>
                <MaterialIcons name={item.icon} size={20} color={theme.Colors.onSurfaceVariant} />
                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
              </Animated.View>
              <Animated.View
                style={[styles.itemContent, styles.itemContentSelected, { opacity: selectedOpacity }]}
                pointerEvents="none"
                aria-hidden
              >
                <MaterialIcons name={item.icon} size={20} color={theme.Colors.onPrimary} />
                <Text style={[styles.label, styles.labelSelected]} numberOfLines={1}>{item.label}</Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) => StyleSheet.create({
  pill: {
    flex: 1,
    maxWidth: PILL_MAX_WIDTH,
    height: PILL_HEIGHT,
    padding: PILL_PADDING,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    // A hairline only in dark mode, where a shadow can't lift the bar off the page
    borderWidth: PILL_BORDER,
    borderColor: isDark ? theme.Colors.outlineVariant : 'transparent',
    shadowColor: theme.Surface.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: ITEM_GAP,
  },
  capsule: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: PILL_ITEM_HEIGHT,
    // Concentric with the pill: its radius minus the inset around the capsule
    borderRadius: PILL_ITEM_HEIGHT / 2,
    backgroundColor: theme.Colors.primary,
  },
  item: {
    flex: 1,
    height: PILL_ITEM_HEIGHT,
    borderRadius: PILL_ITEM_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelectedFallback: {
    backgroundColor: theme.Colors.primary,
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemContentSelected: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: theme.Colors.onSurfaceVariant,
  },
  labelSelected: {
    fontWeight: '600',
    color: theme.Colors.onPrimary,
  },
});
