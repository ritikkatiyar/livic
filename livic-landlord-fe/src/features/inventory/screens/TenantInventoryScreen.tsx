import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import { inventoryItems, tenantAmenities, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

const tenantVisibleItems = inventoryItems.filter((item) => item.location === 'Unit 402' || item.shared);

export default function TenantInventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >
      <View style={styles.header}>
            {isDesktop && (
              <View style={styles.titleBlock}>
                <Text style={styles.kicker}>READ ONLY</Text>
                <Text style={[styles.title, !isDesktop && styles.titleMobile]}>My Unit Inventory</Text>
                <Text style={styles.subtitle}>
                  Review move-in condition records for Unit 402 and the shared amenities included with your lease.
                </Text>
              </View>
            )}
            <TouchableOpacity style={[styles.reportButtonWrapper, !isDesktop && { flex: 1, width: '100%' }]} activeOpacity={0.78}>
              <View
                style={[styles.reportButton, { backgroundColor: theme.Colors.primary }]}
              >
                <MaterialIcons name="support-agent" size={18} color={theme.Colors.onPrimary} />
                <Text style={styles.reportButtonText}>Raise Issue</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.bentoGrid, isDesktop && styles.bentoGridDesktop]}>
            <View style={styles.snapshotCard}>
              <Text style={styles.cardTitle}>Unit Condition Snapshot</Text>
              <MetricRow label="Total Visible Items" value={String(tenantVisibleItems.length)} theme={theme} styles={styles} />
              <MetricRow label="Excellent Condition" value="2" theme={theme} styles={styles} />
              <MetricRow label="Minor Wear" value="1" theme={theme} styles={styles} />
              <View style={styles.dashedDivider} />
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={22} color={theme.Colors.primary} />
                <Text style={styles.verifiedText}>
                  Last verified by management on Jul 20, 2026 during move-in walkthrough.
                </Text>
              </View>
            </View>

            <View style={styles.inventoryColumn}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned & Shared Items</Text>
                <View style={styles.readOnlyPill}>
                  <Text style={styles.readOnlyText}>READ ONLY</Text>
                </View>
              </View>
              {tenantVisibleItems.map((item) => (
                <TenantItemCard key={item.id} item={item} theme={theme} isDark={isDark} styles={styles} />
              ))}
            </View>
          </View>

          <View style={styles.amenitySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Property-wide Amenities</Text>
                <Text style={styles.sectionSubtitle}>Common facilities visible to all active tenants in this property.</Text>
              </View>
              <TouchableOpacity style={styles.bookButtonWrapper} activeOpacity={0.78}>
                <View
                  style={[styles.bookButton, { backgroundColor: theme.Colors.primary }]}
                >
                  <Text style={styles.bookButtonText}>Book Amenity</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.amenityGrid, isDesktop && styles.amenityGridDesktop]}>
              {tenantAmenities.map((amenity) => (
                <View key={amenity.id} style={styles.amenityCard}>
                  <Image source={{ uri: amenity.image }} style={styles.amenityImage} />
                  <View style={styles.amenityOverlay} />
                  <View style={styles.amenityContent}>
                    <View style={styles.amenityTitleRow}>
                      <MaterialIcons name={amenity.icon} size={22} color={theme.Colors.surfaceContainerLowest} />
                      <Text style={styles.amenityTitle}>{amenity.name}</Text>
                    </View>
                    <Text style={styles.amenityMeta}>{amenity.meta}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
    </PageShell>
  );
}

function TenantItemCard({ item, theme, isDark, styles }: { item: InventoryItem, theme: any, isDark: boolean, styles: any }) {
  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <View style={[styles.conditionPill, item.condition === 'Fair' && styles.conditionPillWarn]}>
            <MaterialIcons name={item.condition === 'Fair' ? 'info' : 'check-circle'} size={14} color={item.condition === 'Fair' ? theme.Colors.tertiary : theme.Colors.primary} />
            <Text style={[styles.conditionPillText, item.condition === 'Fair' && styles.conditionPillTextWarn]}>{item.condition}</Text>
          </View>
        </View>
        <Text style={styles.itemDescription}>{item.notes}</Text>
        <View style={styles.itemFooter}>
          <TouchableOpacity style={styles.photoLink} activeOpacity={0.75}>
            <MaterialIcons name="image" size={18} color={theme.Colors.primary} />
            <Text style={styles.photoLinkText}>View Move-in Photos</Text>
          </TouchableOpacity>
          <Text style={styles.itemId}>{item.id}</Text>
        </View>
      </View>
    </View>
  );
}

function MetricRow({ label, value, theme, styles }: { label: string; value: string, theme: any, styles: any }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { gap: theme.Spacing.lg },
  scrollContentDesktop: { padding: theme.Spacing.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18 },
  kicker: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', lineHeight: 16, letterSpacing: 0.2, color: theme.Colors.primary },
  title: { ...theme.Typography.headlineLg, color: theme.Colors.onSurface, lineHeight: 38, marginTop: 6 },
  titleMobile: { ...theme.Typography.headlineMedium, lineHeight: 36 },
  subtitle: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '400', lineHeight: 24, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm, maxWidth: 700 },
  titleBlock: { maxWidth: 720 },
  reportButtonWrapper: {
    height: 46,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  reportButtonText: { color: theme.Colors.onPrimary, fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  bentoGrid: { gap: 18 },
  bentoGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  snapshotCard: {
    flex: 0.85,
    minWidth: 280,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: Theme.Rounded.lg,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.primary, marginBottom: theme.Spacing.xs },
  metricRow: {
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: Theme.Rounded.lg,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: { color: theme.Colors.onSurfaceVariant, fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  metricValue: { color: theme.Colors.primary, fontWeight: '600' },
  dashedDivider: { borderTopWidth: 1, borderTopColor: theme.Colors.outlineVariant, borderStyle: 'dashed', marginVertical: 2 },
  verifiedRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  verifiedText: { flex: 1, color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodyMedium.fontSize, lineHeight: 19, fontStyle: 'italic' },
  inventoryColumn: { flex: 1.7, gap: 12 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  sectionSubtitle: { color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.xs, maxWidth: 620 },
  readOnlyPill: { backgroundColor: theme.Colors.secondaryFixed, paddingHorizontal: 11, paddingVertical: 5, borderRadius: Theme.Rounded.full },
  readOnlyText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: theme.Colors.secondary },
  itemCard: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  itemImage: { width: '100%', height: 180, backgroundColor: theme.Colors.surfaceVariant },
  itemBody: { padding: theme.Spacing.md, gap: 12 },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  itemTitle: { flex: 1, fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,104,117,0.1)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: Theme.Rounded.lg },
  conditionPillWarn: { backgroundColor: theme.Colors.tertiaryFixed },
  conditionPillText: { color: theme.Colors.primary, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600' },
  conditionPillTextWarn: { color: theme.Colors.tertiary },
  itemDescription: { color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodyMedium.fontSize, lineHeight: 20 },
  itemFooter: { borderTopWidth: 1, borderTopColor: theme.Colors.surfaceVariant, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  photoLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoLinkText: { color: theme.Colors.primary, fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  itemId: { color: theme.Colors.outline, fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700' },
  amenitySection: { gap: theme.Spacing.md },
  bookButtonWrapper: { borderRadius: Theme.Rounded.lg, overflow: 'hidden' },
  bookButton: { paddingHorizontal: theme.Spacing.md, paddingVertical: 12 },
  bookButtonText: { color: theme.Colors.onPrimary, fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  amenityGrid: { gap: 14 },
  amenityGridDesktop: { flexDirection: 'row' },
  amenityCard: { flex: 1, minHeight: 230, borderRadius: Theme.Rounded.lg, overflow: 'hidden', backgroundColor: theme.Colors.surfaceVariant },
  amenityImage: { position: 'absolute', width: '100%', height: '100%' },
  amenityOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.34)' },
  amenityContent: { flex: 1, justifyContent: 'flex-end', padding: 18, gap: 5 },
  amenityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amenityTitle: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '600', flex: 1 },
  amenityMeta: { color: 'rgba(255,255,255,0.84)', fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
});
