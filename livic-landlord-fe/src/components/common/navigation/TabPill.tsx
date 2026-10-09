import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Motion, useReducedMotion } from '@/src/theme/motion';
import { haptic } from '@/src/theme/haptics';
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
  /** Things waiting on this tab, e.g. open issues. Hidden when 0; shown as 99+ above 99. */
  badgeCount?: number;
  /** How a screen reader describes the count, e.g. "need attention" or "open". */
  badgeMeaning?: string;
  /**
   * 'alert' (default): a red count, for things to act on. 'neutral': a small dot in the icon colour,
   * for things in progress the person can't clear themselves.
   */
  badgeTone?: 'alert' | 'neutral';
}

const ITEM_GAP = 2;
// Labels grow with the system text size up to 1.3x, and shrink to 11sp rather than ever truncating
const LABEL_MAX_SCALE = 1.3;
const LABEL_MIN_SCALE = 11 / 12;
// The selected mark sits behind the icon only (Material 3), so the label gets the tab's full width
const INDICATOR_WIDTH = 56;
const INDICATOR_HEIGHT = 32;
const INDICATOR_TOP = 1;
// Width of the bubble that shows a tab's name large while it is held
const PEEK_WIDTH = 220;
const PEEK_LINGER_MS = 1500;
const PEEK_POINTER = 10;

/**
 * The bottom bar's pill. A teal indicator behind the selected tab's icon slides to the next tab when
 * the selection changes; icons and labels cross-fade as it passes, so colour never runs ahead of it.
 */
export function TabPill({ items }: { items: TabPillItem[] }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const reduceMotion = useReducedMotion();

  const activeIndex = items.findIndex((item) => item.active);
  const position = useRef(new Animated.Value(Math.max(activeIndex, 0))).current;
  const [rowWidth, setRowWidth] = useState(0);
  // Holding a tab shows its name large above the bar, for anyone whose text size outgrows the label
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

  // Until the row is measured the indicator can't be placed, so the selected tab paints its own
  const itemWidth = rowWidth > 0 ? (rowWidth - ITEM_GAP * (items.length - 1)) / items.length : 0;
  const isMeasured = itemWidth > 0;
  const indicatorWidth = Math.min(INDICATOR_WIDTH, itemWidth - 4);

  return (
    <View style={styles.pill} accessibilityRole="tablist">
      <View style={styles.row} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        {isMeasured && activeIndex >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.capsule,
              {
                width: indicatorWidth,
                transform: [
                  { translateX: Animated.add(Animated.multiply(position, itemWidth + ITEM_GAP), (itemWidth - indicatorWidth) / 2) },
                ],
              },
            ]}
          />
        ) : null}

        {isMeasured && peekIndex !== null && items[peekIndex] ? (
          <View
            pointerEvents="none"
            aria-hidden
            style={[styles.peek, { left: peekIndex * (itemWidth + ITEM_GAP) + itemWidth / 2 - PEEK_WIDTH / 2 }]}
          >
            <View style={styles.peekBubble}>
              <Text style={styles.peekText}>{items[peekIndex].label}</Text>
            </View>
            <View style={styles.peekPointer} />
          </View>
        ) : null}

        {items.map((item, index) => {
          const nearness = { inputRange: [index - 1, index, index + 1], extrapolate: 'clamp' as const };
          const selectedOpacity = isMeasured ? position.interpolate({ ...nearness, outputRange: [0, 1, 0] }) : item.active ? 1 : 0;
          const restingOpacity = isMeasured ? position.interpolate({ ...nearness, outputRange: [1, 0, 1] }) : item.active ? 0 : 1;
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
                (item.accessibilityLabel ?? item.label) + (item.badgeCount ? `, ${item.badgeCount} ${item.badgeMeaning ?? (item.badgeCount === 1 ? 'needs attention' : 'need attention')}` : '')
              }
            >
              <Animated.View style={[styles.itemContent, { opacity: restingOpacity }]}>
                <View style={styles.iconBox}>
                  <MaterialIcons name={item.icon} size={20} color={theme.Colors.onSurfaceVariant} />
                </View>
                <Text
                  style={styles.label}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={LABEL_MIN_SCALE}
                  maxFontSizeMultiplier={LABEL_MAX_SCALE}
                >
                  {item.label}
                </Text>
              </Animated.View>
              <Animated.View
                style={[styles.itemContent, styles.itemContentSelected, { opacity: selectedOpacity }]}
                pointerEvents="none"
                aria-hidden
              >
                <View style={[styles.iconBox, !isMeasured && item.active && styles.iconBoxSelectedFallback]}>
                  <MaterialIcons name={item.icon} size={20} color={theme.Colors.onPrimary} />
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
    shadowColor: theme.Colors.shadowColor,
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
    top: INDICATOR_TOP,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: theme.Colors.primary,
  },
  itemPressed: {
    opacity: 0.75,
  },
  item: {
    flex: 1,
    height: PILL_ITEM_HEIGHT,
    borderRadius: PILL_ITEM_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: INDICATOR_TOP,
    gap: 2,
  },
  iconBox: {
    width: INDICATOR_WIDTH,
    maxWidth: '100%',
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelectedFallback: {
    backgroundColor: theme.Colors.primary,
  },
  itemContentSelected: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    alignSelf: 'stretch',
    textAlign: 'center',
    paddingHorizontal: 1,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: theme.Colors.onSurfaceVariant,
  },
  labelSelected: {
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  // Sits on the icon's top-right corner, ringed in the bar's colour so it reads over the capsule too
  peek: {
    position: 'absolute',
    bottom: PILL_ITEM_HEIGHT + PILL_PADDING + 8,
    width: PEEK_WIDTH,
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
    marginTop: -PEEK_POINTER / 2,
    transform: [{ rotate: '45deg' }],
    backgroundColor: theme.Colors.inverseSurface,
  },
  peekText: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.inverseOnSurface,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: 6,
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
  // Ringed in the bar colour, like the count badge, so it stays visible over the selected indicator
  neutralDot: {
    position: 'absolute',
    top: 2,
    left: '50%',
    marginLeft: 7,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.Colors.surfaceContainerLowest,
    backgroundColor: theme.Colors.onSurfaceVariant,
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize - 2,
    fontWeight: '700',
    color: theme.Colors.onError,
  },
});
