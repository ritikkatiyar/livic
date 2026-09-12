import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { SystemEventItem } from '../api/analytics.api';
import { GlassCard } from '@/src/components/common/display/GlassCard';

interface SystemEventsFeedProps {
  events: SystemEventItem[];
  loading?: boolean;
}

export function SystemEventsFeed({ events, loading = false }: SystemEventsFeedProps) {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const getEventBadge = (type: SystemEventItem['type']) => {
    switch (type) {
      case 'LEASE':
        return {
          bg: `${theme.Colors.primary}18`,
          color: theme.Colors.primary,
          icon: 'check-circle' as const,
        };
      case 'MAINTENANCE':
        return {
          bg: 'rgba(234, 153, 0, 0.15)',
          color: '#e28743',
          icon: 'warning' as const,
        };
      case 'PAYMENT':
        return {
          bg: 'rgba(0, 224, 255, 0.15)',
          color: theme.Colors.tertiary || '#00e0ff',
          icon: 'payments' as const,
        };
      case 'MEMBER':
      default:
        return {
          bg: 'rgba(123, 44, 191, 0.15)',
          color: '#a78bfa',
          icon: 'person-add' as const,
        };
    }
  };

  return (
    <GlassCard style={styles.card} contentStyle={styles.cardContent}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>System Events</Text>
        <TouchableOpacity
          style={styles.moreIconBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => router.push('/reports')}
        >
          <MaterialIcons name="more-horiz" size={20} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <View style={styles.eventsList}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.Colors.primary} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="notifications-none" size={32} color={theme.Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No recent portfolio events recorded</Text>
          </View>
        ) : (
          events.slice(0, 5).map((ev) => {
            const badge = getEventBadge(ev.type);
            return (
              <View key={ev.id} style={styles.eventItem}>
                {/* Apple Squircle Icon Badge */}
                <View style={[styles.iconBadge, { backgroundColor: badge.bg }]}>
                  <MaterialIcons name={badge.icon} size={18} color={badge.color} />
                </View>

                {/* Event Details */}
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {ev.title}
                  </Text>
                  <Text style={styles.eventSubtitle} numberOfLines={1}>
                    {ev.subtitle} • {ev.relativeTime}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* View All Logs Action Button */}
      <TouchableOpacity
        style={styles.viewLogsBtn}
        activeOpacity={0.8}
        onPress={() => router.push('/reports')}
      >
        <Text style={styles.viewLogsText}>View All Logs</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      flex: 1,
      borderRadius: 24,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: theme.Typography.titleLarge?.fontSize || 18,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: -0.3,
    },
    moreIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    eventsList: {
      gap: 14,
      marginBottom: 20,
    },
    eventItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventDetails: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: -0.1,
    },
    eventSubtitle: {
      fontSize: 11,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    loadingBox: {
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyBox: {
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyText: {
      fontSize: 12,
      color: theme.Colors.onSurfaceVariant,
      textAlign: 'center',
    },
    viewLogsBtn: {
      width: '100%',
      minHeight: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      backgroundColor: theme.Colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewLogsText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: 0.2,
    },
  });
