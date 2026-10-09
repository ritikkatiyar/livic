import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Motion, useReducedMotion } from '@/src/theme/motion';
import { haptic } from '@/src/theme/haptics';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { AppTheme } from '@/src/theme/ThemeContext';
import type { TabPillItem } from './TabPill';
import { RAIL_WIDTH } from './bottomDock';

export { RAIL_WIDTH };
const ITEM_HEIGHT = 64;
const ITEM_GAP = 4;
const INDICATOR_WIDTH = 56;
const INDICATOR_HEIGHT = 32;
const LABEL_MAX_SCALE = 1.3;
const LABEL_MIN_SCALE = 11 / 12;
const PEEK_LINGER_MS = 1500;
const PEEK_POINTER = 10;

/**
 * The tablet form of the bottom bar (Material navigation rail): the same tabs stacked down the left
 * edge, with the teal indicator behind the selected icon sliding between them. It never hides on
 * scroll, since it sits beside the content rather than over it.
 */
export function TabRail({ items }: { items: TabPillItem[] }) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const activeIndex = items.findIndex((item) => item.active);
  const position = useRef(new Animated.Value(Math.max(activeIndex, 0))).current;
  // Holding a tab shows its name large beside the rail, as on the phone bar
  const [peekIndex, setPeekIndex] = useState<number | null>(null);
  // The bubble lingers after release so it can be read once the finger is out of the way
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
  }, []);
  const startPeek = (index: number) => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    setPeekIndex(index);
    haptic('press');
  };
  const endPeek = () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeekIndex(null), PEEK_LINGER_MS);
  };

  useEffect(() => {
    if (activeIndex < 0) return;
    if (reduceMotion) {
      position.setValue(activeIndex);
      return;
    }
    Animated.spring(position, { toValue: activeIndex, ...Motion.spring, useNativeDriver: Motion.nativeDriver }).start();
  }, [activeIndex, position, reduceMotion]);

  return (
    <View style={styles.rail} accessibilityRole="tablist">
      {activeIndex >= 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { transform: [{ translateY: Animated.multiply(position, ITEM_HEIGHT + ITEM_GAP) }] }]}
        />
      ) : null}

      {peekIndex !== null && items[peekIndex] ? (
        <View pointerEvents="none" aria-hidden style={[styles.peek, { top: peekIndex * (ITEM_HEIGHT + ITEM_GAP) + 12 }]}>
          <View style={styles.peekPointer} />
          <View style={styles.peekBubble}>
            <Text style={styles.peekText}>{items[peekIndex].label}</Text>
          </View>
        </View>
      ) : null}

      {items.map((item, index) => {
        const nearness = { inputRange: [index - 1, index, index + 1], extrapolate: 'clamp' as const };
        const selectedOpacity = position.interpolate({ ...nearness, outputRange: [0, 1, 0] });
        const restingOpacity = position.interpolate({ ...nearness, outputRange: [1, 0, 1] });
        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.item, pressed && peekIndex !== index && styles.itemPressed]}
            onPress={item.onPress}
            onLongPress={() => startPeek(index)}
            onPressOut={() => {
              if (peekIndex === index) endPeek();
            }}
            accessibilityRole="tab"
            aria-selected={item.active}
            accessibilityLabel={
              (item.accessibilityLabel ?? item.label) +
              (item.badgeCount
                ? `, ${item.badgeCount} ${item.badgeMeaning ?? (item.badgeCount === 1 ? 'needs attention' : 'need attention')}`
                : '')
            }
          >
            <Animated.View style={[styles.itemContent, { opacity: restingOpacity }]}>
              <View style={styles.iconBox}>
                <MaterialIcons name={item.icon} size={22} color={theme.Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={LABEL_MIN_SCALE} maxFontSizeMultiplier={LABEL_MAX_SCALE}>
                {item.label}
              </Text>
            </Animated.View>
            <Animated.View style={[styles.itemContent, styles.itemContentSelected, { opacity: selectedOpacity }]} pointerEvents="none" aria-hidden>
              <View style={styles.iconBox}>
                <MaterialIcons name={item.icon} size={22} color={theme.Colors.onPrimary} />
              </View>
              <Text
                style={[styles.label, styles.labelSelected]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={LABEL_MIN_SCALE}
                maxFontSizeMultiplier={LABEL_MAX_SCALE}
              >
                {item.label}
              </Text>
            </Animated.View>
            {item.badgeCount && item.badgeTone === 'neutral' ? (
              <View style={styles.neutralDot} pointerEvents="none" aria-hidden />
            ) : item.badgeCount ? (
              <View style={styles.badge} pointerEvents="none" aria-hidden>
                <Text style={styles.badgeText} maxFontSizeMultiplier={LABEL_MAX_SCALE}>
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    rail: {
      width: RAIL_WIDTH,
      paddingTop: theme.Spacing.md,
      alignItems: 'center',
      gap: ITEM_GAP,
    },
    indicator: {
      position: 'absolute',
      top: theme.Spacing.md,
      width: INDICATOR_WIDTH,
      height: INDICATOR_HEIGHT,
      borderRadius: INDICATOR_HEIGHT / 2,
      backgroundColor: theme.Colors.primary,
    },
    itemPressed: {
      opacity: 0.75,
    },
    item: {
      width: RAIL_WIDTH,
      height: ITEM_HEIGHT,
      alignItems: 'center',
    },
    itemContent: {
      width: RAIL_WIDTH,
      alignItems: 'center',
      gap: 4,
    },
    itemContentSelected: {
      ...StyleSheet.absoluteFillObject,
    },
    iconBox: {
      width: INDICATOR_WIDTH,
      height: INDICATOR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      alignSelf: 'stretch',
      textAlign: 'center',
      paddingHorizontal: 4,
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '500',
      color: theme.Colors.onSurfaceVariant,
    },
    labelSelected: {
      fontWeight: '600',
      color: theme.Colors.primary,
    },
    peek: {
      position: 'absolute',
      left: RAIL_WIDTH + 4,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
    },
    // Inverse colours, as Material tooltips use, so the bubble stands clear of any page behind it
    peekBubble: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: theme.Colors.inverseSurface,
      shadowColor: theme.Colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    peekPointer: {
      width: PEEK_POINTER,
      height: PEEK_POINTER,
      marginRight: -PEEK_POINTER / 2,
      transform: [{ rotate: '45deg' }],
      backgroundColor: theme.Colors.inverseSurface,
    },
    peekText: {
      fontSize: theme.Typography.headlineLg.fontSize,
      fontWeight: '600',
      color: theme.Colors.inverseOnSurface,
    },
    badge: {
      position: 'absolute',
      top: 0,
      left: RAIL_WIDTH / 2 + 6,
      minWidth: 18,
      // '99+' is the widest it gets; it never reaches the next tab's label
      maxWidth: 34,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.Colors.surfaceContainerLowest,
      backgroundColor: theme.Colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: theme.Typography.labelSmall.fontSize - 2,
      fontWeight: '700',
      color: theme.Colors.onError,
    },
    // Ringed in the bar colour, like the count badge, so it stays visible over the selected indicator
    neutralDot: {
      position: 'absolute',
      top: 2,
      left: RAIL_WIDTH / 2 + 7,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.Colors.surfaceContainerLowest,
      backgroundColor: theme.Colors.onSurfaceVariant,
    },
  });
