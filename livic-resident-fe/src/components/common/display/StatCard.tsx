import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { GlassCard } from './GlassCard';

export interface StatCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export function StatCard({
  label,
  value,
  helperText,
  trend,
  trendType = 'neutral',
  iconName,
  iconColor,
  iconBg,
  style,
  valueStyle,
}: StatCardProps) {
  const { theme, isDark } = useAppTheme();
  const { isMobile } = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, isDark, isMobile), [theme, isDark, isMobile]);

  const activeIconColor = iconColor || theme.Colors.primary;
  const activeIconBg = iconBg || theme.Colors.primaryContainer;

  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return theme.Colors.primary;
      case 'negative':
        return theme.Colors.error;
      case 'neutral':
      default:
        return theme.Colors.onSurfaceVariant;
    }
  };

  const getTrendIcon = () => {
    switch (trendType) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      case 'neutral':
      default:
        return 'trending-flat';
    }
  };

  const iconSize = isMobile ? 16 : 18;
  const trendIconSize = isMobile ? 13 : 15;

  const adaptiveFontSize = React.useMemo(() => {
    const str = String(value ?? '');
    const len = str.length;
    if (isMobile) {
      if (len > 12) return 14;
      if (len > 9) return 16;
      if (len > 6) return 18;
      return 20;
    }
    if (len > 14) return 18;
    if (len > 10) return 21;
    return theme.Typography.headlineMedium.fontSize;
  }, [value, isMobile, theme]);

  return (
    <GlassCard style={[styles.card, style]} contentStyle={styles.cardContent}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        {iconName && (
          <View style={[styles.iconContainer, { backgroundColor: activeIconBg }]}>
            <MaterialIcons name={iconName} size={iconSize} color={activeIconColor} />
          </View>
        )}
      </View>
      <Text
        style={[styles.value, { fontSize: adaptiveFontSize }, valueStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {value}
      </Text>
      {trend && (
        <View style={styles.trendRow}>
          <MaterialIcons name={getTrendIcon()} size={trendIconSize} color={getTrendColor()} style={styles.trendIcon} />
          <Text style={[styles.trendText, { color: getTrendColor() }]} numberOfLines={2}>
            {trend}
          </Text>
        </View>
      )}
      {helperText && !trend && (
        <Text style={styles.helperText} numberOfLines={2}>
          {helperText}
        </Text>
      )}
    </GlassCard>
  );
}

const createStyles = (theme: any, isDark: boolean, isMobile: boolean) => StyleSheet.create({
  card: {
    flex: 1,
    minWidth: isMobile ? '47%' : 150,
    flexBasis: isMobile ? '47%' : 150,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: isMobile ? 12 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isMobile ? 4 : theme.Spacing.xs,
  },
  label: {
    fontSize: isMobile ? 11 : theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
    flex: 1,
    marginRight: theme.Spacing.xs,
    letterSpacing: 0.2,
  },
  iconContainer: {
    width: isMobile ? 30 : 34,
    height: isMobile ? 30 : 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: isMobile ? 20 : theme.Typography.headlineMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    letterSpacing: -0.4,
    marginVertical: isMobile ? 2 : theme.Spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isMobile ? 2 : theme.Spacing.xs,
  },
  trendIcon: {
    marginRight: 4,
  },
  trendText: {
    fontSize: isMobile ? 10 : theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
  },
  helperText: {
    fontSize: isMobile ? 10 : theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: isMobile ? 2 : theme.Spacing.xs,
    fontWeight: '400',
  },
});
