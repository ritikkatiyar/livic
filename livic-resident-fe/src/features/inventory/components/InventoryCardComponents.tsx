import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { InventoryCondition, InventoryItem, AssignmentItem, VerificationItem } from '@/src/features/inventory/mockInventoryData';

const getConditionConfig = (theme: any) => ({
  Excellent: { color: theme.Colors.primary, bg: 'rgba(5,150,105,0.1)'  },
  Good:      { color: theme.Colors.primary, bg: 'rgba(0,104,117,0.1)'  },
  Fair:      { color: theme.Colors.tertiary, bg: 'rgba(217,119,6,0.1)'  },
  Damaged:   { color: theme.Colors.error, bg: 'rgba(186,26,26,0.1)'  },
});

const getStatusConfig = (theme: any) => ({
  Assigned:      { color: theme.Colors.primary, bg: 'rgba(5,150,105,0.1)',   dot: theme.Colors.primary },
  Available:     { color: theme.Colors.primary, bg: 'rgba(0,104,117,0.1)',   dot: theme.Colors.primary },
  Shared:        { color: theme.Colors.secondary, bg: 'rgba(79,70,229,0.1)',   dot: theme.Colors.secondary },
  'Service Due': { color: theme.Colors.error, bg: 'rgba(186,26,26,0.08)',  dot: theme.Colors.error },
});

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function ConditionPill({ condition }: { condition: InventoryCondition }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const cfg = (getConditionConfig(theme) as Record<string, any>)[condition];
  return (
    <View style={[styles.conditionPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.conditionDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.conditionText, { color: cfg.color }]}>{condition}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const cfg = (getStatusConfig(theme) as Record<string, any>)[status] ?? { color: theme.Colors.onSurfaceVariant, bg: 'rgba(107,114,128,0.1)', dot: '#9ca3af' };
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{status}</Text>
    </View>
  );
}

export function SummaryLine({ label, value, danger = false, bold = false }: {
  label: string; value: string; danger?: boolean; bold?: boolean;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '600', color: theme.Colors.onSurface }]}>{label}</Text>
      <Text style={[styles.summaryValue, danger && { color: theme.Colors.error }, bold && { fontSize: theme.Typography.bodyLarge.fontSize }]}>{value}</Text>
    </View>
  );
}

export function MobileInventoryCard({ item }: { item: InventoryItem }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const serviceDue = item.status === 'Service Due';
  return (
    <View style={[styles.inventoryCard, serviceDue && styles.inventoryCardAlert]}>
      {serviceDue && (
        <View style={styles.alertStripe} />
      )}
      <View style={styles.inventoryCardInner}>
        <Image source={{ uri: item.image }} style={styles.inventoryThumb} />
        <View style={styles.inventoryContent}>
          <View style={styles.inventoryTopRow}>
            <View style={styles.inventoryCategoryPill}>
              <MaterialIcons name={item.icon as any} size={11} color={theme.Colors.onSurfaceVariant} />
              <Text style={styles.inventoryCategoryText}>{item.category}</Text>
            </View>
            <StatusPill status={item.status} />
          </View>
          <Text style={styles.inventoryName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.inventoryMeta} numberOfLines={1}>{item.location} · {item.serial}</Text>
          <View style={styles.inventoryFooter}>
            <ConditionPill condition={item.condition} />
            <Text style={styles.inventoryValue}>{item.value}</Text>
          </View>
        </View>
      </View>
      {serviceDue && (
        <View style={styles.serviceAlertBar}>
          <MaterialIcons name="warning-amber" size={13} color={theme.Colors.error} />
          <Text style={styles.serviceAlertText}>Service overdue · {item.nextService}</Text>
        </View>
      )}
    </View>
  );
}

export function DesktopRegistryRow({ item }: { item: InventoryItem }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={[styles.tableRow, item.status === 'Service Due' && styles.tableRowAlert]}>
      <View style={[styles.tableCell, styles.itemCell]}>
        <Image source={{ uri: item.image }} style={styles.itemThumb} />
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>SN: {item.serial}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <View style={styles.categoryChip}>
          <MaterialIcons name={item.icon as any} size={13} color={theme.Colors.onSurfaceVariant} />
          <Text style={styles.categoryChipText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <Text style={styles.cellText}>{item.location}</Text>
      </View>
      <View style={styles.tableCell}>
        <ConditionPill condition={item.condition} />
      </View>
      <View style={styles.tableCell}>
        <StatusPill status={item.status} />
      </View>
      <View style={[styles.tableCell, { alignItems: 'flex-end' }]}>
        <Text style={styles.valueText}>{item.value}</Text>
      </View>
      <TouchableOpacity style={styles.moreBtn}>
        <MaterialIcons name="more-vert" size={20} color={theme.Colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

export function AssignmentCard({ item }: { item: AssignmentItem }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const selected = item.assignmentStatus !== 'Unselected';
  const isDraft  = item.assignmentStatus === 'Draft';

  return (
    <View style={[styles.assignCard, !selected && styles.assignCardMuted]}>
      <View style={styles.assignHeader}>
        <View style={styles.assignIdentity}>
          <Image source={{ uri: item.image }} style={styles.assignThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.assignName}>{item.location}: {item.name}</Text>
            <Text style={styles.assignMeta}>SN: {item.serial}</Text>
          </View>
        </View>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <MaterialIcons name="check" size={14} color={theme.Colors.surfaceContainerLowest} />}
        </View>
      </View>

      {selected ? (
        <>
          <View style={styles.assignFields}>
            <View style={styles.assignField}>
              <Text style={styles.fieldLabel}>CONDITION</Text>
              <ConditionPill condition={item.assignmentCondition} />
            </View>
            <View style={styles.assignField}>
              <Text style={styles.fieldLabel}>NOTES</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>{item.notes}</Text>
            </View>
          </View>
          <View style={styles.assignFooter}>
            <TouchableOpacity style={styles.photoLink}>
              <MaterialIcons name={item.photoCount > 0 ? 'photo-library' : 'add-a-photo'} size={14} color={theme.Colors.primary} />
              <Text style={styles.photoLinkText}>
                {item.photoCount > 0 ? `${item.photoCount} photos` : 'Add photo'}
              </Text>
            </TouchableOpacity>
            {isDraft && (
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>Draft</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.assignHint}>{"Tap to select and document this item's condition"}</Text>
      )}
    </View>
  );
}

export function VerificationCard({ item }: { item: VerificationItem }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const isDamaged = item.status === 'Damaged';
  const isReview  = item.status === 'Review';
  const statusCfg = isDamaged
    ? { color: theme.Colors.error, bg: 'rgba(186,26,26,0.1)', label: 'Damaged' }
    : isReview
    ? { color: theme.Colors.tertiary || theme.Colors.secondary, bg: 'rgba(217,119,6,0.1)',  label: 'Under Review' }
    : { color: theme.Colors.primary, bg: 'rgba(5,150,105,0.1)',  label: 'Good' };

  return (
    <View style={styles.verifyCard}>
      <View style={styles.verifyHeader}>
        <View style={[styles.verifyIconCircle, { backgroundColor: statusCfg.bg }]}>
          <MaterialIcons name={item.icon as any} size={20} color={statusCfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.verifyName}>{item.name}</Text>
          <Text style={styles.verifyArea}>{item.area}</Text>
        </View>
        <View style={[styles.verifyBadge, { backgroundColor: statusCfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
          <Text style={[styles.verifyBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.conditionCompare}>
        <View style={styles.conditionCompareItem}>
          <Text style={styles.compareLabel}>MOVE-IN</Text>
          <ConditionPill condition={item.moveInCondition} />
        </View>
        <MaterialIcons name="arrow-forward" size={18} color="#c4cdd0" />
        <View style={styles.conditionCompareItem}>
          <Text style={styles.compareLabel}>RETURN</Text>
          <ConditionPill condition={item.returnCondition} />
        </View>
      </View>

      <View style={styles.photoGrid}>
        <View style={styles.photoPanel}>
          <Image source={{ uri: item.moveInPhoto }} style={styles.photoImage} />
          <View style={[styles.photoTag, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
            <Text style={styles.photoTagText}>MOVE-IN</Text>
          </View>
        </View>
        <View style={styles.photoPanel}>
          <Image source={{ uri: item.returnPhoto }} style={styles.photoImage} />
          <View
            style={[styles.photoTag, isDamaged ? styles.photoTagDanger : { backgroundColor: 'rgba(0,0,0,0.65)' }]}
          >
            <Text style={[styles.photoTagText, isDamaged && { color: theme.Colors.error }]}>RETURN</Text>
          </View>
        </View>
      </View>

      {(isDamaged || isReview) && (
        <View style={styles.damageRow}>
          <View style={styles.damageDesc}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <Text style={styles.damageText}>{item.damageDescription}</Text>
          </View>
          {item.deduction > 0 && (
            <View style={styles.deductionBox}>
              <Text style={styles.fieldLabel}>DEDUCTION</Text>
              <Text style={styles.deductionAmount}>{formatCurrency(item.deduction)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: theme.Spacing.xs, borderRadius: 20, alignSelf: 'flex-start' },
  conditionDot: { width: 6, height: 6, borderRadius: 3 },
  conditionText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: theme.Spacing.xs, borderRadius: 20, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500' },
  summaryLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.Spacing.xs },
  summaryLabel: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, flex: 1 },
  summaryValue: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },

  inventoryCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, overflow: 'hidden' },
  inventoryCardAlert: { borderColor: theme.Colors.error },
  alertStripe: { height: 3, backgroundColor: theme.Colors.error },
  inventoryCardInner: { flexDirection: 'row', gap: 12, padding: 14 },
  inventoryThumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: theme.Colors.outlineVariant },
  inventoryContent: { flex: 1, gap: theme.Spacing.xs },
  inventoryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inventoryCategoryPill: { flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs, backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: theme.Spacing.sm, paddingVertical: 3, borderRadius: 6 },
  inventoryCategoryText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant },
  inventoryName: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  inventoryMeta: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant },
  inventoryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  inventoryValue: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  serviceAlertBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: 14, paddingVertical: theme.Spacing.sm, borderTopWidth: 1, borderTopColor: theme.Colors.outlineVariant },
  serviceAlertText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.error },

  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: theme.Colors.outlineVariant },
  tableRowAlert: { backgroundColor: theme.Colors.surfaceContainerLow },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: theme.Colors.outlineVariant },
  itemTextBlock: { flex: 1 },
  itemName: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  itemMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: 9, paddingVertical: theme.Spacing.xs, borderRadius: 8, alignSelf: 'flex-start' },
  categoryChipText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant },
  cellText: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '400' },
  valueText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  moreBtn: { padding: 6 },

  assignCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, overflow: 'hidden', padding: 14, gap: 12 },
  assignCardMuted: { opacity: 0.6 },
  assignHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: theme.Colors.outlineVariant },
  assignName: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  assignMeta: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: theme.Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: theme.Colors.primary, borderColor: theme.Colors.primary },
  assignFields: { flexDirection: 'row', gap: 10 },
  assignField: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2 },
  fieldValue: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '500', color: theme.Colors.onSurface },
  assignFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: theme.Spacing.sm, borderTopWidth: 1, borderTopColor: theme.Colors.outlineVariant },
  photoLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoLinkText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '500', color: theme.Colors.primary },
  draftBadge: { backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  draftBadgeText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.tertiary || theme.Colors.secondary },
  assignHint: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, paddingTop: theme.Spacing.xs },

  verifyCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, overflow: 'hidden', padding: theme.Spacing.md, gap: 14 },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyIconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifyName: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  verifyArea: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  verifyBadgeText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500' },
  conditionCompare: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conditionCompareItem: { gap: theme.Spacing.xs },
  compareLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2 },
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoPanel: { flex: 1, height: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.Colors.outlineVariant },
  photoImage: { width: '100%', height: '100%' },
  photoTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: theme.Spacing.sm, paddingVertical: theme.Spacing.xs, borderRadius: 6, overflow: 'hidden' },
  photoTagDanger: { backgroundColor: theme.Colors.error },
  photoTagText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest, letterSpacing: 0.4 },
  damageRow: { flexDirection: 'row', gap: 12, backgroundColor: theme.Colors.surfaceContainerLow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  damageDesc: { flex: 1, gap: theme.Spacing.xs },
  damageText: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurface, lineHeight: 19 },
  deductionBox: { gap: theme.Spacing.xs, alignItems: 'flex-end' },
  deductionAmount: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.error },
});
