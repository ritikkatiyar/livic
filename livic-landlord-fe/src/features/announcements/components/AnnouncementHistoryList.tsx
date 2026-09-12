import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import type { Announcement } from '@/src/features/announcements/api/announcement.api';
import type { PropertyResponse } from '@/src/types/property';

interface AnnouncementHistoryListProps {
  properties: PropertyResponse[];
  historyPropertyId: string | null;
  setHistoryPropertyId: (val: string | null) => void;
  announcements: Announcement[];
  loadingAnnouncements: boolean;
}

export function AnnouncementHistoryList({
  properties,
  historyPropertyId,
  setHistoryPropertyId,
  announcements,
  loadingAnnouncements,
}: AnnouncementHistoryListProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ba1a1a';
      case 'WARNING': return '#e28743';
      default: return theme.Colors.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MAINTENANCE': return 'build';
      case 'EMERGENCY': return 'error';
      case 'BILLING': return 'payment';
      case 'EVENT': return 'event';
      default: return 'campaign';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeader}>BROADCAST HISTORY</Text>



      <View style={styles.listContainer}>
        {loadingAnnouncements ? (
          <ActivityIndicator size="small" color={theme.Colors.primary} style={{ marginVertical: theme.Spacing.xl }} />
        ) : !Array.isArray(announcements) || announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={32} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: theme.Spacing.sm }} />
            <Text style={styles.emptyText}>No announcement logs for this property.</Text>
          </View>
        ) : (
          <View style={styles.scrollContent}>
            {(announcements || []).map((item) => {
              const sevColor = getSeverityColor(item.severity);
              const catIcon = getCategoryIcon(item.category);
              
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyTitleRow}>
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${sevColor}15` }]}>
                        <MaterialIcons name={catIcon} size={18} color={sevColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historyMeta}>
                          {item.category} • {item.targetType} {
                            item.targetType === 'FLOOR' && item.targetFloorNumber != null ? `(Floor ${item.targetFloorNumber})` :
                            item.targetType === 'UNIT' && item.targetUnitId != null ? `(Unit ${item.targetUnitId})` : ''
                          }
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sevColor }]}>
                      <Text style={styles.severityText}>{item.severity}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.historyContent}>{item.content}</Text>
                  
                  <View style={styles.historyFooter}>
                    <Text style={styles.historySender}>By {item.creatorName || 'Manager'}</Text>
                    <Text style={styles.historyTime}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    padding: theme.Spacing.lg,
    borderRadius: 16,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  composerLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: theme.Spacing.sm,
    marginTop: 18,
  },
  listContainer: {
    marginTop: 20,
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.xxl,
  },
  emptyText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  scrollContent: {
    gap: theme.Spacing.md,
  },
  historyCard: {
    padding: theme.Spacing.md,
    borderRadius: 14,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  historyMeta: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: 8,
  },
  severityText: {
    fontSize: theme.Typography.labelSmall.fontSize - 2,
    fontWeight: '600',
    color: theme.Colors.surfaceContainerLowest,
  },
  historyContent: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 104, 117, 0.05)',
    paddingTop: 10,
  },
  historySender: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  historyTime: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },

});
