import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { assignmentItems } from '@/src/features/inventory/mockInventoryData';
import { AssignmentCard, SummaryLine } from './InventoryCardComponents';

interface InventoryMoveInViewProps {
  isDesktop: boolean;
}

export function InventoryMoveInView({ isDesktop }: InventoryMoveInViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const selectedCount = assignmentItems.filter(i => i.assignmentStatus !== 'Unselected').length;
  const photoCount    = assignmentItems.reduce((s, i) => s + i.photoCount, 0);
  const progress      = selectedCount / assignmentItems.length;

  return (
    <View style={styles.sectionStack}>
      <View style={[styles.moveBanner, { backgroundColor: theme.Colors.primary }]}>
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>NEW MOVE-IN ASSIGNMENT</Text>
          <Text style={styles.moveBannerTitle}>Jordan Mitchell</Text>
          <Text style={styles.moveBannerMeta}>Lease #L-8824 · Unit 402-B · Move-in Jul 20, 2026</Text>
        </View>
        <View style={styles.progressBox}>
          <Text style={styles.progressFraction}>{selectedCount}/{assignmentItems.length}</Text>
          <Text style={styles.progressSublabel}>items done</Text>
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
            <Text style={styles.panelTitle}>Inventory Checklist</Text>
            <View style={styles.panelActions}>
              <TouchableOpacity style={styles.ghostBtn}><Text style={styles.ghostBtnText}>Select All</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn}><Text style={styles.ghostBtnText}>Filter</Text></TouchableOpacity>
            </View>
          </View>
          {assignmentItems.map(item => <AssignmentCard key={item.id} item={item} />)}
        </View>

        <View style={styles.rail}>
          <View style={styles.railHeader}>
            <View style={[styles.railIconCircle, { backgroundColor: theme.Colors.primary }]}>
              <MaterialIcons name="how-to-reg" size={18} color={theme.Colors.surfaceContainerLowest} />
            </View>
            <Text style={styles.panelTitle}>Summary</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Selected Items"  value={`${selectedCount} items`} />
            <SummaryLine label="Photos Attached" value={`${photoCount} photos`} />
            <SummaryLine label="Needs Attention" value="1 item" danger />
            <View style={styles.railDivider} />
            <SummaryLine label="Kitchen Appliances" value="98/100" />
            <SummaryLine label="Living Fixtures"    value="Draft" />
          </View>
          <TouchableOpacity style={styles.primaryWideBtn} activeOpacity={0.82}>
            <View
              style={[styles.primaryWideBtnInner, { backgroundColor: theme.Colors.primary }]}
            >
              <MaterialIcons name="how-to-reg" size={18} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.primaryWideBtnText}>Confirm Assignment</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostWideBtn}>
            <Text style={styles.ghostWideBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  moveBanner: { borderRadius: 22, overflow: 'hidden', minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, gap: theme.Spacing.md },
  moveBannerContent: { flex: 1 },
  moveBannerKicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6 },
  moveBannerTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest, marginTop: theme.Spacing.xs },
  moveBannerMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: 'rgba(255,255,255,0.8)', marginTop: theme.Spacing.xs },
  progressBox: { alignItems: 'flex-end', gap: theme.Spacing.xs, minWidth: 100 },
  progressFraction: { fontSize: theme.Typography.headlineSmall.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest },
  progressSublabel: { fontSize: theme.Typography.labelSmall.fontSize, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  progressTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  workflowGrid: { gap: 14 },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1.9, gap: 12 },
  workflowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.Spacing.sm },
  ghostBtn: { backgroundColor: theme.Colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.Colors.outlineVariant, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  ghostBtnText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  panelActions: { flexDirection: 'row', gap: theme.Spacing.sm, alignItems: 'center' },
  rail: { flex: 1, minWidth: 260, borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, backgroundColor: theme.Colors.surfaceContainerLowest, padding: theme.Spacing.md, gap: 14, overflow: 'hidden' },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  railBody: { gap: 10 },
  railDivider: { height: 1, backgroundColor: theme.Colors.outlineVariant, marginVertical: 2 },
  primaryWideBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryWideBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.Spacing.sm, paddingVertical: 14 },
  primaryWideBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
  ghostWideBtn: { borderRadius: 14, borderWidth: 1, borderColor: theme.Colors.outlineVariant, paddingVertical: 13, alignItems: 'center' },
  ghostWideBtnText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurfaceVariant },
});
