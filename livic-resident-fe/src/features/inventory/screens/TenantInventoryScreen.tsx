import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { getTenantVisibleInventory, BackendInventoryItem } from '@/src/features/inventory/api/inventory.api';
import { getActiveLease, LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { getPropertyDetails } from '@/src/features/property/api/property.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { PageShell } from '@/src/components/common/layout/PageShell';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useRouter } from 'expo-router';

function getAmenityMeta(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) {
    return {
      icon: 'wifi' as const,
      meta: 'High-speed mesh network',
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('pool') || lower.includes('swim')) {
    return {
      icon: 'pool' as const,
      meta: 'Open 6:00 AM - 10:00 PM',
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('gym') || lower.includes('fitness')) {
    return {
      icon: 'fitness-center' as const,
      meta: 'Level 2 • 24/7 Access',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('park') || lower.includes('car')) {
    return {
      icon: 'local-parking' as const,
      meta: 'Covered & Reserved Bay',
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard')) {
    return {
      icon: 'security' as const,
      meta: 'CCTV & Keycard Entry',
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('backup') || lower.includes('power') || lower.includes('generator')) {
    return {
      icon: 'power' as const,
      meta: '24/7 Power Backup',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('laundry') || lower.includes('wash')) {
    return {
      icon: 'local-laundry-service' as const,
      meta: 'Common Utility Area',
      image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&auto=format&fit=crop&q=80',
    };
  }
  return {
    icon: 'star' as const,
    meta: 'Included Building Facility',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
  };
}

export default function TenantInventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [unitItems, setUnitItems] = useState<BackendInventoryItem[]>([]);
  const [sharedItems, setSharedItems] = useState<BackendInventoryItem[]>([]);
  const [propertyAmenities, setPropertyAmenities] = useState<string[]>([]);
  const [lease, setLease] = useState<LeaseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!accessToken) return;
      try {
        setLoading(true);
        const leaseData = await getActiveLease(accessToken);
        if (mounted && leaseData) {
          setLease(leaseData);
          if (leaseData.propertyId) {
            try {
              const propDetails = await getPropertyDetails(leaseData.propertyId, accessToken);
              if (mounted && propDetails?.amenities) {
                setPropertyAmenities(propDetails.amenities);
              }
            } catch (pErr) {
              console.warn('[TenantInventoryScreen] Failed to fetch property amenities:', pErr);
            }
          }
        }
        const invData = await getTenantVisibleInventory(accessToken);
        if (mounted) {
          setUnitItems(invData.unitItems || []);
          setSharedItems(invData.sharedItems || []);
        }
      } catch (err) {
        console.warn('[TenantInventoryScreen] Error loading inventory:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [accessToken]);

  const allItems = [...unitItems, ...sharedItems];
  const totalCount = allItems.length;
  const excellentCount = allItems.filter(i => (i.condition || '').toUpperCase() === 'EXCELLENT').length;
  const goodOrMinorCount = allItems.filter(i => (i.condition || '').toUpperCase() === 'GOOD' || (i.condition || '').toUpperCase() === 'FAIR').length;

  const amenitiesToRender = propertyAmenities.map((name, idx) => ({
    id: `amenity-${idx}`,
    name,
    ...getAmenityMeta(name),
  }));

  return (
    <PageShell scrollable={true} contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}>
      <View style={styles.header}>
        {isDesktop && (
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>Verified Asset Register</Text>
            <Text style={styles.title}>My Unit Inventory</Text>
            <Text style={styles.subtitle}>
              Review move-in condition records for {lease?.unitNumber ? `Unit ${lease.unitNumber}` : 'your assigned residence'} and shared building amenities.
            </Text>
          </View>
        )}
        <ActionButton
          label="Report Item Issue"
          icon="report-problem"
          variant="primary"
          size="md"
          onPress={() => router.push('/tenant-maintenance')}
          fullWidth={!isDesktop}
        />
      </View>

      <View style={[styles.bentoGrid, isDesktop && styles.bentoGridDesktop]}>
        <View style={styles.snapshotCard}>
          <Text style={styles.cardTitle}>Inventory Summary</Text>
          
          <MetricRow label="Total Registered Items" value={totalCount.toString()} styles={styles} />
          <MetricRow label="Excellent Condition" value={excellentCount.toString()} styles={styles} />
          <MetricRow label="Good / Minor Wear" value={goodOrMinorCount.toString()} styles={styles} />

          <View style={styles.dashedDivider} />

          <View style={styles.verifiedRow}>
            <MaterialIcons name="verified" size={18} color={theme.Colors.primary} />
            <Text style={styles.verifiedText}>Verified on digital record for your property.</Text>
          </View>
        </View>

        <View style={styles.inventoryColumn}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Unit Items</Text>
            <View style={styles.readOnlyPill}>
              <Text style={styles.readOnlyText}>Verified Record</Text>
            </View>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.Colors.primary} />
            </View>
          ) : unitItems.length > 0 ? (
            unitItems.map(item => (
              <TenantItemCard key={item.id} item={item} theme={theme} styles={styles} isDark={isDark} />
            ))
          ) : (
            <View style={styles.emptyUnitCard}>
              <MaterialIcons name="inventory" size={40} color={theme.Colors.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '700', color: theme.Colors.onSurface }}>No Inventory Items On File</Text>
              <Text style={{ color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodyMedium.fontSize, marginTop: 4, textAlign: 'center' }}>
                Your property manager has not logged specific appliance or furniture assets for this unit yet.
              </Text>
            </View>
          )}

          {sharedItems.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: theme.Spacing.md }]}>
                <Text style={styles.sectionTitle}>Shared Building Facilities</Text>
              </View>

              {sharedItems.map(item => (
                <TenantItemCard key={item.id} item={item} theme={theme} styles={styles} isDark={isDark} />
              ))}
            </>
          )}
        </View>
      </View>

      <View style={{ marginTop: theme.Spacing.md }}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Property-wide Amenities</Text>
            <Text style={styles.sectionSubtitle}>Common facilities visible to all active tenants in this property.</Text>
          </View>
          <ActionButton
            label="Book Amenity"
            variant="outline"
            size="sm"
            onPress={() => router.push('/tenant-maintenance')}
          />
        </View>

        {amenitiesToRender.length > 0 ? (
          <View style={[styles.amenityGrid, isDesktop && styles.amenityGridDesktop]}>
            {amenitiesToRender.map((amenity) => (
              <View key={amenity.id} style={styles.amenityCard}>
                <Image source={{ uri: amenity.image }} style={styles.amenityImage} />
                <View style={styles.amenityOverlay} />
                <View style={styles.amenityContent}>
                  <View style={styles.amenityTitleRow}>
                    <MaterialIcons name={amenity.icon} size={22} color="#ffffff" />
                    <Text style={styles.amenityTitle}>{amenity.name}</Text>
                  </View>
                  <Text style={styles.amenityMeta}>{amenity.meta}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <MaterialIcons name="pool" size={44} color={theme.Colors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Property Amenities Logged</Text>
            <Text style={styles.emptySub}>
              Your landlord has not registered property-wide amenities for this property yet.
            </Text>
          </View>
        )}
      </View>
    </PageShell>
  );
}

function TenantItemCard({ item, theme, styles, isDark }: { item: BackendInventoryItem; theme: any; styles: any; isDark: boolean }) {
  const isFairOrPoor = item.condition === 'Fair' || item.condition === 'DAMAGED' || item.condition === 'POOR';
  const defaultImage = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80';

  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image || defaultImage }} style={styles.itemImage} />
      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <View style={[styles.conditionPill, isFairOrPoor ? styles.conditionPillWarn : styles.conditionPillSuccess]}>
            <MaterialIcons 
              name={isFairOrPoor ? 'info' : 'check-circle'} 
              size={14} 
              color={isFairOrPoor ? theme.Colors.tertiary : theme.Colors.success} 
            />
            <Text style={[styles.conditionPillText, isFairOrPoor ? styles.conditionPillTextWarn : styles.conditionPillTextSuccess]}>
              {item.condition || 'Good'}
            </Text>
          </View>
        </View>
        <Text style={styles.itemDescription}>{item.notes || `Model: ${item.modelNumber || 'N/A'} • Serial: ${item.serialNumber || 'N/A'}`}</Text>
        <View style={styles.itemFooter}>
          <View style={styles.photoLink}>
            <MaterialIcons name="inventory-2" size={18} color={theme.Colors.primary} />
            <Text style={styles.photoLinkText}>{item.category || 'Asset Item'}</Text>
          </View>
          <Text style={styles.itemId}>ID: {item.id ? item.id.substring(0, 8) : 'N/A'}</Text>
        </View>
      </View>
    </View>
  );
}

function MetricRow({ label, value, styles }: { label: string; value: string; styles: any }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  scrollContent: { 
    padding: theme.Spacing.md, 
    paddingBottom: 120, 
    gap: theme.Spacing.lg 
  },
  scrollContentDesktop: { 
    padding: theme.Spacing.xl, 
    maxWidth: 1200, 
    width: '100%', 
    alignSelf: 'center' 
  },
  header: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    gap: 18 
  },
  kicker: { 
    fontSize: theme.Typography.bodySmall.fontSize, 
    fontWeight: '600', 
    letterSpacing: 0.5, 
    color: theme.Colors.primary 
  },
  title: { 
    fontSize: theme.Typography.headlineLg.fontSize, 
    fontWeight: '700', 
    lineHeight: 38, 
    color: theme.Colors.onSurface, 
    marginTop: 6 
  },
  subtitle: { 
    fontSize: theme.Typography.bodyLarge.fontSize, 
    fontWeight: '400', 
    lineHeight: 24, 
    color: theme.Colors.onSurfaceVariant, 
    marginTop: theme.Spacing.sm, 
    maxWidth: 700 
  },
  titleBlock: { 
    maxWidth: 720 
  },
  bentoGrid: { 
    gap: 18 
  },
  bentoGridDesktop: { 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  snapshotCard: {
    flex: 0.85,
    minWidth: 280,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: theme.Rounded.lg,
    padding: 18,
    gap: 12,
  },
  cardTitle: { 
    fontSize: theme.Typography.titleLarge.fontSize, 
    fontWeight: '700', 
    color: theme.Colors.primary, 
    marginBottom: theme.Spacing.xs 
  },
  metricRow: {
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: theme.Rounded.md,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: { 
    color: theme.Colors.onSurfaceVariant, 
    fontWeight: '500', 
    fontSize: theme.Typography.bodyMedium.fontSize 
  },
  metricValue: { 
    color: theme.Colors.primary, 
    fontWeight: '700' 
  },
  dashedDivider: { 
    borderTopWidth: 1, 
    borderTopColor: theme.Colors.outline, 
    borderStyle: 'dashed', 
    marginVertical: 2 
  },
  verifiedRow: { 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'flex-start' 
  },
  verifiedText: { 
    flex: 1, 
    color: theme.Colors.onSurfaceVariant, 
    fontSize: theme.Typography.bodyMedium.fontSize, 
    lineHeight: 19 
  },
  inventoryColumn: { 
    flex: 1.7, 
    gap: 12 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: 12 
  },
  sectionTitle: { 
    fontSize: theme.Typography.titleLarge.fontSize, 
    fontWeight: '700', 
    color: theme.Colors.onSurface 
  },
  sectionSubtitle: { 
    color: theme.Colors.onSurfaceVariant, 
    marginTop: theme.Spacing.xs, 
    maxWidth: 620 
  },
  readOnlyPill: { 
    backgroundColor: theme.Colors.surfaceContainerLow, 
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    paddingHorizontal: 11, 
    paddingVertical: 5, 
    borderRadius: theme.Rounded.full 
  },
  readOnlyText: { 
    fontSize: theme.Typography.labelSmall.fontSize, 
    fontWeight: '600', 
    color: theme.Colors.onSurfaceVariant 
  },
  emptyUnitCard: {
    padding: 32,
    borderRadius: theme.Rounded.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  itemCard: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: theme.Rounded.lg,
    overflow: 'hidden',
  },
  itemImage: { 
    width: '100%', 
    height: 180, 
    backgroundColor: theme.Colors.surfaceContainerLow 
  },
  itemBody: { 
    padding: theme.Spacing.md, 
    gap: 12 
  },
  itemTopRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    gap: 12 
  },
  itemTitle: { 
    flex: 1, 
    fontSize: theme.Typography.bodyLg.fontSize, 
    fontWeight: '700', 
    color: theme.Colors.onSurface 
  },
  conditionPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingHorizontal: 9, 
    paddingVertical: 4, 
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
  },
  conditionPillSuccess: { 
    backgroundColor: theme.Colors.successContainer, 
    borderColor: theme.Colors.success 
  },
  conditionPillWarn: { 
    backgroundColor: theme.Colors.tertiaryContainer, 
    borderColor: theme.Colors.tertiary 
  },
  conditionPillText: { 
    fontSize: theme.Typography.bodySmall.fontSize, 
    fontWeight: '600' 
  },
  conditionPillTextSuccess: { 
    color: theme.Colors.success 
  },
  conditionPillTextWarn: { 
    color: theme.Colors.tertiary 
  },
  itemDescription: { 
    color: theme.Colors.onSurfaceVariant, 
    fontSize: theme.Typography.bodyMedium.fontSize, 
    lineHeight: 20 
  },
  itemFooter: { 
    borderTopWidth: 1, 
    borderTopColor: theme.Colors.outline, 
    paddingTop: 12, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    gap: 10 
  },
  photoLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  photoLinkText: { 
    color: theme.Colors.primary, 
    fontWeight: '600', 
    fontSize: theme.Typography.bodyMedium.fontSize 
  },
  itemId: { 
    color: theme.Colors.onSurfaceVariant, 
    fontSize: theme.Typography.labelSmall.fontSize, 
    fontWeight: '500' 
  },
  amenityGrid: { 
    gap: 14 
  },
  amenityGridDesktop: { 
    flexDirection: 'row' 
  },
  amenityCard: { 
    flex: 1, 
    minHeight: 230, 
    borderRadius: theme.Rounded.lg, 
    overflow: 'hidden', 
    backgroundColor: theme.Colors.surfaceContainerLow 
  },
  amenityImage: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%' 
  },
  amenityOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.34)' 
  },
  amenityContent: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    padding: 18, 
    gap: 5 
  },
  amenityTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  amenityTitle: { 
    color: '#ffffff', 
    fontSize: theme.Typography.bodyLg.fontSize, 
    fontWeight: '700', 
    flex: 1 
  },
  amenityMeta: { 
    color: 'rgba(255,255,255,0.84)', 
    fontWeight: '500', 
    fontSize: theme.Typography.bodyMedium.fontSize 
  },
  emptyBox: { 
    padding: 32, 
    borderRadius: theme.Rounded.lg, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  emptyTitle: { 
    fontSize: theme.Typography.titleLarge.fontSize, 
    fontWeight: '700', 
    color: theme.Colors.onSurface, 
    marginBottom: 6 
  },
  emptySub: { 
    fontSize: theme.Typography.bodyMedium.fontSize, 
    color: theme.Colors.onSurfaceVariant, 
    textAlign: 'center', 
    lineHeight: 22, 
    maxWidth: 420 
  },
});
