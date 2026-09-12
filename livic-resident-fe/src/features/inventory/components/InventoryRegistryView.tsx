import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryStats, inventoryItems, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { DesktopRegistryRow, MobileInventoryCard } from './InventoryCardComponents';

interface InventoryRegistryViewProps {
  items: InventoryItem[];
  totalCount?: number;
  stats?: Array<{ label: string; value: string; helper: string; icon: string }>;
  isDesktop: boolean;
  serviceOnly: boolean;
  onToggleService: () => void;
  onAddItem?: () => void;
}

export function InventoryRegistryView({
  items,
  totalCount,
  stats,
  isDesktop,
  serviceOnly,
  onToggleService,
  onAddItem,
}: InventoryRegistryViewProps) {
  const { theme, isDark } = useAppTheme();

  const STAT_COLORS = React.useMemo(() => [
    theme.Colors.primary,
    theme.Colors.error,
    theme.Colors.secondary,
    theme.Colors.primary
  ], [theme]);
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const displayStats = stats && stats.length > 0 ? stats : inventoryStats;
  const count = totalCount !== undefined ? totalCount : items.length;

  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {displayStats.map((stat, i) => (
          <View key={stat.label} style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
            <View style={[styles.statIconCircle, { backgroundColor: STAT_COLORS[i % STAT_COLORS.length] }]}>
              <MaterialIcons name={stat.icon as any} size={18} color={theme.Colors.surfaceContainerLowest} />
            </View>
            <Text style={[styles.statValue, { color: STAT_COLORS[i % STAT_COLORS.length] }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statHelper}>{stat.helper}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
          <View>
            <Text style={styles.panelTitle}>Itemized Registry</Text>
            <Text style={styles.panelSub}>{items.length} of {count} assets</Text>
          </View>
          <View style={styles.panelActions}>
            <TouchableOpacity
              style={[styles.filterPill, serviceOnly && styles.filterPillActive]}
              onPress={onToggleService}
            >
              {serviceOnly && (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.Colors.error }]} />
              )}
              <MaterialIcons name="handyman" size={14} color={serviceOnly ? '#fff' : theme.Colors.onSurfaceVariant} />
              <Text style={[styles.filterPillText, serviceOnly && styles.filterPillTextActive]}>Service Due</Text>
            </TouchableOpacity>
            {onAddItem && (
              <TouchableOpacity style={styles.addSmallBtn} onPress={onAddItem}>
                <View style={[styles.addSmallBtnInner, { backgroundColor: theme.Colors.primary }]}>
                  <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.addSmallBtnText}>Add Item</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.Colors.surfaceContainerHigh }]}>
              <MaterialIcons name="inventory-2" size={32} color={theme.Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Inventory Items Tracked</Text>
            <Text style={styles.emptySubtitle}>Add furniture, appliances, HVAC or fixtures to track asset value and condition evidence.</Text>
            {onAddItem && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddItem}>
                <View style={[styles.addSmallBtnInner, { backgroundColor: theme.Colors.primary }]}>
                  <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.addSmallBtnText}>Add First Item</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ) : isDesktop ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              {['Item', 'Category', 'Location', 'Condition', 'Status', 'Value', ''].map((h, i) => (
                <View key={i} style={[styles.tableCell, i === 0 && styles.itemCell, i === 6 && { flex: 0, width: 36 }]}>
                  <Text style={styles.tableHeaderText}>{h}</Text>
                </View>
              ))}
            </View>
            {items.map(item => <DesktopRegistryRow key={item.id} item={item} />)}
          </View>
        ) : (
          <View style={styles.cardList}>
            {items.map(item => <MobileInventoryCard key={item.id} item={item} />)}
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsRowDesktop: { flexWrap: 'nowrap' },
  statCard: {
    flex: 1, flexBasis: '46%', minHeight: 110, borderRadius: 16,
    borderWidth: 1, borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest, padding: theme.Spacing.md, overflow: 'hidden', gap: 3,
  },
  statCardDesktop: { flexBasis: 0 },
  statIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.sm },
  statValue: { fontSize: theme.Typography.headlineMd.fontSize, fontWeight: '600' },
  statLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2 },
  statHelper: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 1 },
  panel: { borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, overflow: 'hidden' },
  panelHeader: { padding: theme.Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.Colors.outlineVariant, gap: 12 },
  panelHeaderMobile: { flexDirection: 'column', alignItems: 'stretch' },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  panelSub: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  panelActions: { flexDirection: 'row', gap: theme.Spacing.sm, alignItems: 'center' },
  filterPill: { flexDirection: 'row', alignItems: 'center', minHeight: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: theme.Colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.Colors.outlineVariant, gap: 6, overflow: 'hidden' },
  filterPillActive: { borderColor: 'transparent' },
  filterPillText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant },
  filterPillTextActive: { color: theme.Colors.surfaceContainerLowest },
  iconBtn: { minWidth: 44, minHeight: 44, borderRadius: 14, backgroundColor: theme.Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  tableContainer: { paddingBottom: theme.Spacing.xs },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: theme.Colors.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: theme.Colors.outlineVariant },
  tableHeaderText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2 },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardList: { padding: 14, gap: 12 },
  addSmallBtn: { borderRadius: 22, overflow: 'hidden' },
  addSmallBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 6, paddingHorizontal: 16, paddingVertical: theme.Spacing.sm },
  addSmallBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600' },
  emptyState: { padding: theme.Spacing.xxl, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  emptySubtitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 400, lineHeight: 19 },
  emptyAddBtn: { marginTop: theme.Spacing.sm, borderRadius: 22, overflow: 'hidden' },
});
