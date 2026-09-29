import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle, DimensionValue, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { GlassCard } from '../display/GlassCard';
import { withAlpha } from '@/src/theme/colorUtils';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius }: SkeletonProps) {
  const { theme, isDark } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          backgroundColor: isDark ? withAlpha(theme.Colors.onSurface, 0.08) : withAlpha(theme.Colors.primary, 0.08),
          width: width,
          height: height,
          borderRadius: borderRadius ?? 12,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style, isDesktop }: { style?: StyleProp<ViewStyle>; isDesktop?: boolean }) {
  if (isDesktop) {
    return (
      <GlassCard style={[styles.cardContainer, styles.desktopCardContainer, style]}>
        <View style={styles.desktopCardRow}>
          {/* Left Side: 3D Building Preview Placeholder */}
          <Skeleton width={280} height={232} borderRadius={16} />
          {/* Right Side: Info, Metrics, Actions */}
          <View style={styles.desktopCardRight}>
            <View>
              <Skeleton width="45%" height={24} borderRadius={6} style={{ marginBottom: 10 }} />
              <Skeleton width="70%" height={16} borderRadius={4} />
            </View>
            <View style={{ gap: 10 }}>
              <Skeleton width="100%" height={32} borderRadius={10} />
              <Skeleton width="100%" height={32} borderRadius={10} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width="48%" height={42} borderRadius={12} />
              <Skeleton width="48%" height={42} borderRadius={12} />
            </View>
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={[styles.cardContainer, style]}>
      {/* Property Hero Image Placeholder */}
      <Skeleton width="100%" height={180} borderRadius={16} style={{ marginBottom: 14 }} />
      <View style={styles.cardHeader}>
        <Skeleton width="55%" height={20} borderRadius={6} />
        <Skeleton width={28} height={28} borderRadius={8} />
      </View>
      <Skeleton width="75%" height={14} borderRadius={4} style={{ marginTop: 8, marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Skeleton width="48%" height={34} borderRadius={10} />
        <Skeleton width="48%" height={34} borderRadius={10} />
      </View>
    </GlassCard>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.statRow}>
      {Array.from({ length: count }).map((_, idx) => (
        <GlassCard key={idx} style={styles.statCardItem}>
          <View style={styles.cardHeader}>
            <Skeleton width="50%" height={14} borderRadius={4} />
            <Skeleton width={24} height={24} borderRadius={8} />
          </View>
          <Skeleton width="65%" height={24} borderRadius={6} style={{ marginTop: 10, marginBottom: 6 }} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </GlassCard>
      ))}
    </View>
  );
}

export function SkeletonCardGrid({ count = 4, isDesktop }: { count?: number; isDesktop?: boolean }) {
  return (
    <View style={styles.cardGrid}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={[styles.gridItem, isDesktop && { flexBasis: '100%' }]}>
          <SkeletonCard isDesktop={isDesktop} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Skeleton width="100%" height={60} borderRadius={16} style={style} />;
}

export function SkeletonText({ style, width = '60%' }: { style?: StyleProp<ViewStyle>; width?: DimensionValue }) {
  return <Skeleton width={width} height={16} borderRadius={4} style={style} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCardItem: {
    flex: 1,
    minWidth: 150,
    borderRadius: 20,
    padding: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: 280,
  },
  desktopCardContainer: {
    minHeight: 280,
    padding: 24,
    borderRadius: 24,
  },
  desktopCardRow: {
    flexDirection: 'row',
    gap: 24,
  },
  desktopCardRight: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 16,
  },
});
