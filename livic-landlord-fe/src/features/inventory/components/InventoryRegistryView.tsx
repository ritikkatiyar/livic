import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryStats, inventoryItems, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { StatCard } from '@/src/components/common/display/StatCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { DesktopRegistryRow, MobileInventoryCard } from './InventoryCardComponents';
import { PaginatedContainer } from '@/src/components/common/layout/PaginatedContainer';

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

  const realStats = React.useMemo(() => {
    if (stats && stats.length > 0) return stats;
    const totalAssets = items.length;
    const serviceRequired = items.filter(i => (i as any).status === 'SERVICE_REQUIRED' || (i as any).condition === 'DAMAGED' || (i as any).needsService).length;
    const assignedCount = items.filter(i => (i as any).unitNumber != null || (i as any).assignedUnitNumber != null).length;
    const totalVal = items.reduce((acc, i) => acc + ((i as any).assetValue || (i as any).value || 0), 0);

    return [
      { label: 'Total Assets', value: String(totalAssets), helper: `${totalAssets} items in inventory`, icon: 'inventory-2' },
      { label: 'Service Due', value: String(serviceRequired), helper: `${serviceRequired} items need maintenance`, icon: 'handyman' },
      { label: 'Assigned Items', value: String(assignedCount), helper: `${assignedCount} items bound to units`, icon: 'assignment-turned-in' },
      { label: 'Total Value', value: `₹${totalVal.toLocaleString()}`, helper: 'Cumulative asset valuation', icon: 'account-balance-wallet' },
    ];
  }, [stats, items]);

  const displayStats = realStats;
  const count = totalCount !== undefined ? totalCount : items.length;

  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {displayStats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            loading={!stats && items.length === 0}
            helperText={stat.helper}
            iconName={stat.icon as any}
            iconColor={STAT_COLORS[i % STAT_COLORS.length]}
            valueColor={STAT_COLORS[i % STAT_COLORS.length]}
            style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
          />
        ))}
      </View>

      <View style={styles.panel}>
        <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
          <View>
            <Text style={styles.panelTitle}>Itemized Registry</Text>
            <Text style={styles.panelSub}>{items.length} of {count} assets</Text>
          </View>
          <View style={styles.panelActions}>
            <FilterPill
              label="Service Due"
              icon="handyman"
              active={serviceOnly}
              onPress={onToggleService}
              size="sm"
            />
            {onAddItem && (
              <ActionButton
                label="Add Item"
                icon="add"
                variant="primary"
                size="sm"
                onPress={onAddItem}
              />
            )}
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="inventory-2" size={32} color={theme.Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Inventory Items Tracked</Text>
            <Text style={styles.emptySubtitle}>Add furniture, appliances, HVAC or fixtures to track asset value and condition evidence.</Text>
            {onAddItem && (
              <ActionButton
                label="Add First Item"
                icon="add"
                variant="primary"
                size="md"
                onPress={onAddItem}
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        ) : (
          <PaginatedContainer
            data={items}
            itemGap={isDesktop ? 0 : 12}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (
              isDesktop ? <DesktopRegistryRow item={item} /> : <MobileInventoryCard item={item} />
            )}
          />
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
    flex: 1, flexBasis: '46%', minHeight: 110, borderRadius: 20,
    borderWidth: 1.5, borderColor: theme.Colors.glassStroke,
    backgroundColor: theme.Colors.glassFill, padding: theme.Spacing.md, overflow: 'hidden', gap: 3,
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
  emptyIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: theme.Colors.surfaceContainerHigh },
  emptyTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  emptySubtitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 400, lineHeight: 19 },
  emptyAddBtn: { marginTop: theme.Spacing.sm, borderRadius: 22, overflow: 'hidden' },
});
