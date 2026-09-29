import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { PropertyResponse } from '@/src/types/property';

const PAGE_GAP = 12;

interface PropertyPagerProps {
  properties: PropertyResponse[];
  /** `isActive` is true only for the page in view, so heavy content (3D) mounts for one property at a time. */
  renderCard: (item: PropertyResponse, isActive: boolean) => React.ReactElement;
}

/**
 * Mobile Home: one property per page, swiped horizontally. Only the visible page and its
 * immediate neighbours are mounted, and only the visible one renders its 3D building.
 */
export function PropertyPager({ properties, renderCard }: PropertyPagerProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const listRef = useRef<FlatList<PropertyResponse>>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Search can shrink the list under us; snap back to the first result.
  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [properties.length]);

  const stride = pageWidth + PAGE_GAP;

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!stride) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / stride);
      setActiveIndex(Math.max(0, Math.min(index, properties.length - 1)));
    },
    [stride, properties.length]
  );

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(index, properties.length - 1));
    listRef.current?.scrollToOffset({ offset: target * stride, animated: true });
    setActiveIndex(target);
  };

  return (
    <View onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
      {properties.length > 1 && (
        <View style={styles.controls}>
          <Text style={styles.counter}>
            {activeIndex + 1} of {properties.length}
          </Text>
          <View style={styles.arrows}>
            <PagerArrow icon="chevron-left" label="Previous property" disabled={activeIndex === 0} onPress={() => goTo(activeIndex - 1)} styles={styles} theme={theme} />
            <PagerArrow icon="chevron-right" label="Next property" disabled={activeIndex >= properties.length - 1} onPress={() => goTo(activeIndex + 1)} styles={styles} theme={theme} />
          </View>
        </View>
      )}

      {pageWidth > 0 && (
        <FlatList
          ref={listRef}
          data={properties}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={stride}
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
          ItemSeparatorComponent={() => <View style={{ width: PAGE_GAP }} />}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews
          renderItem={({ item, index }) => <View style={{ width: pageWidth }}>{renderCard(item, index === activeIndex)}</View>}
        />
      )}
    </View>
  );
}

function PagerArrow({ icon, label, disabled, onPress, styles, theme }: {
  icon: 'chevron-left' | 'chevron-right';
  label: string;
  disabled: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.arrow, disabled && styles.arrowDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <MaterialIcons name={icon} size={22} color={theme.Colors.onSurface} />
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.Spacing.sm,
    },
    counter: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
    },
    arrows: {
      flexDirection: 'row',
      gap: theme.Spacing.sm,
    },
    arrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.Colors.surfaceContainerHigh,
    },
    arrowDisabled: {
      opacity: 0.35,
    },
  });
