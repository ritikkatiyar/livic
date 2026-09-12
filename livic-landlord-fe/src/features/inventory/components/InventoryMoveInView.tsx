import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type AssignmentItem, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { AssignmentCard, SummaryLine } from './InventoryCardComponents';
import { createLeaseAssignments } from '../api/inventory.api';
import { StatCard } from '@/src/components/common/display/StatCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { formatCurrency } from '@/src/utils/formatters';

interface InventoryMoveInViewProps {
  assignedItems?: AssignmentItem[];
  availableItems?: InventoryItem[];
  leaseId?: string;
  token?: string;
  isDesktop: boolean;
  onRefresh?: () => void;
  onAddItem?: () => void;
}

export function InventoryMoveInView({
  assignedItems = [],
  availableItems = [],
  leaseId,
  token,
  isDesktop,
  onRefresh,
  onAddItem,
}: InventoryMoveInViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const hasAssigned = assignedItems.length > 0;
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItemIds.size === availableItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(availableItems.map((i) => i.id)));
    }
  };

  const handleConfirmAssignment = async () => {
    if (!leaseId || !token) {
      Alert.alert('Error', 'Missing active lease context');
      return;
    }
    if (selectedItemIds.size === 0) {
      Alert.alert('Required', 'Please select at least one item to assign');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloads = Array.from(selectedItemIds).map((id) => {
        const item = availableItems.find((i) => i.id === id);
        return {
          itemId: id,
          conditionAtAssignment: item?.condition?.toUpperCase() || 'EXCELLENT',
          assignmentNotes: item?.notes || undefined,
        };
      });

      await createLeaseAssignments(leaseId, { items: payloads }, token);
      Alert.alert('Success', `Assigned ${payloads.length} items to lease #${leaseId.substring(0, 8)}`);
      setSelectedItemIds(new Set());
      if (onRefresh) onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign inventory items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = hasAssigned ? assignedItems.length : selectedItemIds.size;
  const totalCount = hasAssigned ? assignedItems.length : availableItems.length;
  const progress = totalCount > 0 ? selectedCount / totalCount : 0;

  return (
    <View style={styles.sectionStack}>
      <View style={styles.moveBanner}>
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>MOVE-IN ASSIGNMENT</Text>
          <Text style={styles.moveBannerTitle}>Lease Inventory Assignment</Text>
          <Text style={styles.moveBannerMeta}>{leaseId ? `Lease #${leaseId}` : 'Document items on move-in'}</Text>
        </View>
        <View style={styles.progressBox}>
          <Text style={styles.progressFraction}>{selectedCount}/{totalCount}</Text>
          <Text style={styles.progressSublabel}>{hasAssigned ? 'assigned' : 'selected'}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: theme.Colors.surfaceContainerLowest }]}
            />
          </View>
        </View>
      </View>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          <View style={styles.workflowHeader}>
            <Text style={styles.panelTitle}>
              {hasAssigned ? 'Assigned Items Checklist' : 'Select Items to Assign'}
            </Text>
            {!hasAssigned && availableItems.length > 0 && (
              <View style={styles.panelActions}>
                <TouchableOpacity style={styles.ghostBtn} onPress={selectAll}>
                  <Text style={styles.ghostBtnText}>
                    {selectedItemIds.size === availableItems.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {hasAssigned ? (
            assignedItems.map((item) => <AssignmentCard key={item.id} item={item} />)
          ) : availableItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="inventory-2" size={32} color={theme.Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Property Inventory Available</Text>
              <Text style={styles.emptySubtitle}>
                Add appliances, furniture, or fixtures in the Registry tab before assigning them to leases.
              </Text>
              {onAddItem && (
                <ActionButton
                  label="Add Item to Registry"
                  icon="add"
                  variant="primary"
                  size="md"
                  onPress={onAddItem}
                  style={{ marginTop: 12 }}
                />
              )}
            </View>
          ) : (
            availableItems.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => toggleSelect(item.id)}
                >
                  <View
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  >
                    <View style={styles.itemCardContent}>
                      <View style={styles.itemCardLeft}>
                        <TouchableOpacity
                          style={[styles.checkbox, isSelected && styles.checkboxActive]}
                          onPress={() => toggleSelect(item.id)}
                        >
                          {isSelected && <MaterialIcons name="check" size={14} color={theme.Colors.surfaceContainerLowest} />}
                        </TouchableOpacity>
                        <View>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>
                            {item.location || 'Shared'} · {item.category} {item.serial ? `· SN: ${item.serial}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.itemCardRight}>
                        <View style={styles.conditionChip}>
                          <Text style={styles.conditionText}>{item.condition || 'Excellent'}</Text>
                        </View>
                        <Text style={styles.itemValue}>{item.value}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.rail}>
          <View style={styles.railHeader}>
            <View style={styles.railIconCircle}>
              <MaterialIcons name="fact-check" size={18} color={theme.Colors.surfaceContainerLowest} />
            </View>
            <Text style={styles.panelTitle}>Summary</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Status" value={hasAssigned ? 'Active Lease Handover' : 'Move-In Setup'} />
            <SummaryLine label="Selected Items" value={String(selectedCount)} />
            <SummaryLine label="Available Assets" value={String(availableItems.length)} />
            <SummaryLine label="Assignment Mode" value={hasAssigned ? 'Locked' : 'Configuring'} bold />
          </View>

          {!hasAssigned && availableItems.length > 0 && (
            <View style={styles.railFooter}>
              <TouchableOpacity
                style={styles.confirmBtn}
                activeOpacity={0.82}
                disabled={isSubmitting || selectedItemIds.size === 0}
                onPress={handleConfirmAssignment}
              >
                <View
                  style={[
                    styles.confirmBtnInner,
                    { backgroundColor: selectedItemIds.size > 0 ? theme.Colors.primary : theme.Colors.outlineVariant }
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                  ) : (
                    <>
                      <MaterialIcons name="how-to-reg" size={18} color={theme.Colors.surfaceContainerLowest} />
                      <Text style={styles.confirmBtnText}>Confirm Assignment ({selectedItemIds.size})</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  moveBanner: {
    borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: theme.Colors.primary, minHeight: 90, gap: theme.Spacing.md,
  },
  moveBannerContent: { flex: 1, gap: 2 },
  moveBannerKicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', letterSpacing: 0.2, color: 'rgba(255,255,255,0.85)' },
  moveBannerTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest },
  moveBannerMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  progressBox: { alignItems: 'flex-end', gap: theme.Spacing.xs, minWidth: 100 },
  progressFraction: { fontSize: theme.Typography.headlineSmall.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest },
  progressSublabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.2 },
  progressTrack: { width: 100, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  workflowGrid: { flexDirection: 'column', gap: theme.Spacing.md },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1, gap: 12 },
  workflowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.Spacing.xs },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  panelActions: { flexDirection: 'row', gap: theme.Spacing.sm },
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: theme.Colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  ghostBtnText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '500', color: theme.Colors.primary },

  itemCard: {
    borderRadius: 14, borderWidth: 1, borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest, padding: 14,
  },
  itemCardSelected: {
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  itemCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: theme.Colors.onSurfaceVariant,
    justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  checkboxActive: { borderColor: theme.Colors.primary, backgroundColor: theme.Colors.primary },
  itemName: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  itemMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  itemCardRight: { alignItems: 'flex-end', gap: theme.Spacing.xs },
  conditionChip: { backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: theme.Spacing.sm, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  conditionText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: theme.Colors.primary },
  itemValue: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },

  emptyCard: {
    borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest, padding: 40, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.xs, backgroundColor: theme.Colors.surfaceContainerHigh },
  emptyTitle: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  emptySubtitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 360, lineHeight: 18 },
  emptyAddBtn: { marginTop: theme.Spacing.sm, borderRadius: 12, overflow: 'hidden' },
  emptyAddBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: theme.Spacing.md, paddingVertical: 10 },
  emptyAddBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },

  rail: {
    width: '100%', maxWidth: 320, borderRadius: 16, borderWidth: 1,
    borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest,
    padding: 18, gap: 14,
  },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.primary },
  railBody: { gap: 10 },
  railFooter: { marginTop: 6 },
  confirmBtn: { borderRadius: 14, overflow: 'hidden' },
  confirmBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.Spacing.sm, paddingVertical: 14, paddingHorizontal: theme.Spacing.md },
  confirmBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
});
