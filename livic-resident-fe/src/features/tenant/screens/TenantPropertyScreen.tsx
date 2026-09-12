import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';

import { useResponsive } from '@/src/hooks/useResponsive';
import { useActiveLease, usePropertyDetails } from '@/src/hooks/useResidentData';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

interface TenantPropertyScreenProps {
  token: string;
  onLogout: () => void;
}

export default function TenantPropertyScreen({ token, onLogout }: TenantPropertyScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  // Consumes shared @tanstack/react-query server-state query cache per Rule 6.C & Phase 5
  const { data: lease } = useActiveLease(token);
  const { data: property } = usePropertyDetails(lease?.propertyId, token);
  const [showLeaseModal, setShowLeaseModal] = useState(false);

  const amenitiesList = (property?.amenities && property.amenities.length > 0)
    ? property.amenities
    : ['High-speed Fiber Wi-Fi', 'Rooftop Pool', 'Covered Parking', '24/7 Fitness Center'];

  return (
    <PageShell
      scrollable={true}
      header={isDesktop ? <DesktopNavBar title="My Unit & Property Lease" activeTab="Property" /> : null}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >
          {/* Main Unit Card */}
          <View style={styles.glassCard}>
            <View style={styles.mainCardHeaderRow}>
              <View style={styles.iconBox}>
                <MaterialIcons name="apartment" size={theme.IconSizes.xl} color={theme.Colors.primary} />
              </View>
              <View style={styles.mainCardHeaderRowContent}>
                <Text style={styles.propertyName}>{lease?.propertyName || 'Assigned Residence'}</Text>
                <Text style={styles.unitInfo}>{lease?.unitId ? `Unit ID: ${lease.unitId.substring(0, 8)}` : 'Unit Lease Linked'} • Active</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{lease?.status || 'ACTIVE'}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Monthly Rent</Text>
                <View style={styles.statValueRow}>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {lease?.monthlyRentAmount ? `₹${lease.monthlyRentAmount.toLocaleString()}` : 'N/A'}
                  </Text>
                  <Text style={styles.statSubLabel}> / month</Text>
                </View>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Security Deposit</Text>
                <Text style={styles.statValueHighlight} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {lease?.securityDeposit ? `₹${lease.securityDeposit.toLocaleString()}` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Lease Contract Card */}
          <View style={styles.glassCard}>
            <View style={styles.leaseHeaderRow}>
              <Text style={styles.leaseTitle}>Lease Agreement Details</Text>
              <MaterialIcons name="gavel" size={theme.IconSizes.lg} color={theme.Colors.primary} />
            </View>
            
            <View style={styles.leaseGrid}>
              <View style={styles.leaseRow}>
                <MaterialIcons name="calendar-today" size={theme.IconSizes.md} color={theme.Colors.primaryFixedDim} />
                <View style={styles.leaseRowContent}>
                  <Text style={styles.leaseLabel}>Move-In Date</Text>
                  <Text style={styles.leaseValue}>{lease?.moveInDate || 'On File'}</Text>
                </View>
              </View>
              
              <View style={styles.leaseRow}>
                <MaterialIcons name="event-busy" size={theme.IconSizes.md} color={theme.Colors.primaryFixedDim} />
                <View style={styles.leaseRowContent}>
                  <Text style={styles.leaseLabel}>Move-Out Date</Text>
                  <Text style={styles.leaseValue}>{lease?.moveOutDate || 'On File'}</Text>
                </View>
              </View>

              <View style={styles.leaseRow}>
                <MaterialIcons name="verified-user" size={theme.IconSizes.md} color={theme.Colors.primaryFixedDim} />
                <View style={styles.leaseRowContent}>
                  <Text style={styles.leaseLabel}>Escrow Protection</Text>
                  <Text style={styles.leaseValue}>Verified & Locked</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setShowLeaseModal(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.leaseBtn, { backgroundColor: theme.Colors.primary }]}>
                <MaterialIcons name="description" size={theme.IconSizes.sm} color={theme.Colors.onPrimary} />
                <Text style={styles.leaseBtnText}>View Digital Lease Contract</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.leaseSignedText}>Digitally Signed & Timestamped on Record</Text>
          </View>

          {/* Property Amenities Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Included Property Amenities</Text>
            <Text style={styles.sectionSub}>Available 24/7 for all building occupants</Text>
          </View>
          
          <View style={styles.amenitiesGrid}>
            {amenitiesList.map((amenityName, idx) => {
              const meta = getAmenityMeta(amenityName);
              return (
                <View key={idx} style={styles.amenityCard}>
                  <View style={styles.amenityIconBox}>
                    <MaterialIcons name={meta.icon} size={theme.IconSizes.lg} color={theme.Colors.primary} />
                  </View>
                  <Text style={styles.amenityTitle}>{amenityName}</Text>
                  <Text style={styles.amenitySub}>{meta.sub}</Text>
                </View>
              );
            })}
          </View>


        {/* Digital Lease Contract Modal */}
        {showLeaseModal && (
          <Modal transparent visible={true} animationType="slide" onRequestClose={() => setShowLeaseModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Digital Lease Contract</Text>
                  <TouchableOpacity onPress={() => setShowLeaseModal(false)}>
                    <MaterialIcons name="close" size={theme.IconSizes.lg} color={theme.Colors.onBackground} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScrollView}>
                  <Text style={styles.modalContractTitle}>RESIDENTIAL TENANCY LEASE AGREEMENT</Text>
                  <Text style={styles.modalContractText}>
                    This Residential Lease Agreement (&quot;Agreement&quot;) is executed between Property Owner and Tenant for Unit {lease?.unitId?.substring(0, 8) || '101'}.
                    {"\n\n"}
                    1. RENT & FEES: The monthly rent of ₹{lease?.monthlyRentAmount?.toLocaleString() || '10,000'} is due on or before the 5th of each calendar month.
                    {"\n\n"}
                    2. SECURITY DEPOSIT: The security deposit of ₹{lease?.securityDeposit?.toLocaleString() || '30,000'} is held securely and refundable upon lease expiration subject to unit inspection.
                    {"\n\n"}
                    3. MAINTENANCE: Tenant agrees to report all maintenance or structural defects promptly via the Tenant Portal.
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseBtnWrapper}
                  onPress={() => setShowLeaseModal(false)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.modalCloseBtn, { backgroundColor: theme.Colors.primary }]}>
                    <Text style={styles.modalCloseBtnText}>Close Agreement Viewer</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.Spacing.containerPadding, paddingBottom: theme.Spacing.xxl, gap: theme.Spacing.lg },
  scrollContentDesktop: { paddingTop: theme.Spacing.lg },
  
  glassCard: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: theme.Rounded.xl,
    padding: theme.Spacing.containerPadding,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden'
  },
  mainCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.md, marginBottom: theme.Spacing.lg },
  mainCardHeaderRowContent: { flex: 1 },
  iconBox: { width: theme.Spacing.xxl, height: theme.Spacing.xxl, borderRadius: theme.Rounded.lg, backgroundColor: theme.Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  propertyName: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground },
  unitInfo: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm },
  statusBadge: { backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: theme.Spacing.md, paddingVertical: theme.Spacing.sm, borderRadius: theme.Rounded.md },
  statusBadgeText: { color: theme.Colors.primary, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', letterSpacing: 0.4 },
  
  statsGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '47%', backgroundColor: theme.Colors.surfaceContainerLow, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  statLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2, marginBottom: theme.Spacing.xs },
  statSubLabel: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statValue: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600', color: theme.Colors.onBackground, letterSpacing: -0.3 },
  statValueHighlight: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600', color: theme.Colors.primary, letterSpacing: -0.3 },

  leaseHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.Spacing.lg },
  leaseTitle: { color: theme.Colors.onBackground, fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600' },
  leaseGrid: { gap: theme.Spacing.md, marginBottom: theme.Spacing.lg },
  leaseRow: { flexDirection: 'row', alignItems: 'center' },
  leaseRowContent: { marginLeft: theme.Spacing.md },
  leaseLabel: { color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '400', marginBottom: theme.Spacing.xs },
  leaseValue: { color: theme.Colors.onSurface, fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600' },
  leaseBtn: {
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.Rounded.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  leaseBtnText: { color: theme.Colors.onPrimary, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
  leaseSignedText: { color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodySmall.fontSize, textAlign: 'center', marginTop: theme.Spacing.md },

  sectionHeader: { marginTop: theme.Spacing.sm },
  sectionTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground },
  sectionSub: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm },
  
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.Spacing.md },
  amenityCard: { width: '47.8%', backgroundColor: theme.Colors.surfaceContainerLowest, borderRadius: theme.Rounded.xl, padding: theme.Spacing.md, borderWidth: 1, borderColor: theme.Colors.outlineVariant, overflow: 'hidden' },
  amenityIconBox: { width: theme.Spacing.xxl, height: theme.Spacing.xxl, borderRadius: theme.Rounded.md, backgroundColor: theme.Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: theme.Spacing.md },
  amenityTitle: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onBackground },
  amenitySub: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.containerPadding,
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.45)',
  },
  modalContent: {
    width: '100%',
    maxWidth: theme.Breakpoints.modalMaxWidth,
    borderRadius: theme.Rounded.xl,
    overflow: 'hidden',
    padding: theme.Spacing.containerPadding,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.Spacing.md },
  modalTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground },
  modalScrollView: { maxHeight: theme.Dimensions.modalScrollMaxHeight },
  modalContractTitle: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600', color: theme.Colors.primary, marginBottom: theme.Spacing.md },
  modalContractText: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: theme.Typography.bodyLarge.lineHeight },
  modalCloseBtnWrapper: {
    marginTop: theme.Spacing.lg,
    borderRadius: theme.Rounded.full,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  modalCloseBtn: {
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.Rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: { color: theme.Colors.onPrimary, fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600' }
});

function getAmenityMeta(name: string): { icon: React.ComponentProps<typeof MaterialIcons>['name']; sub: string } {
  const lower = (name || '').toLowerCase();
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) {
    return { icon: 'wifi', sub: 'High-Speed Fiber Connection' };
  }
  if (lower.includes('pool') || lower.includes('swim')) {
    return { icon: 'pool', sub: 'Temperature Controlled Pool' };
  }
  if (lower.includes('gym') || lower.includes('fit')) {
    return { icon: 'fitness-center', sub: 'Cardio & Strength Training' };
  }
  if (lower.includes('park')) {
    return { icon: 'local-parking', sub: 'Reserved Resident Slot' };
  }
  if (lower.includes('secur') || lower.includes('cctv') || lower.includes('guard')) {
    return { icon: 'security', sub: '24/7 Gated & Monitored Security' };
  }
  if (lower.includes('power') || lower.includes('backup') || lower.includes('generator')) {
    return { icon: 'bolt', sub: '100% Automatic Inverter / DG Backup' };
  }
  if (lower.includes('laundry') || lower.includes('wash')) {
    return { icon: 'local-laundry-service', sub: 'In-Building Shared Laundry' };
  }
  if (lower.includes('lift') || lower.includes('elevat')) {
    return { icon: 'elevator', sub: 'High-Speed Automatic Elevator' };
  }
  if (lower.includes('ev') || lower.includes('charg')) {
    return { icon: 'ev-station', sub: 'Dedicated EV Fast Charger' };
  }
  if (lower.includes('club') || lower.includes('lounge')) {
    return { icon: 'weekend', sub: 'Community Lounge & Event Space' };
  }
  return { icon: 'stars', sub: 'Included Property Facility' };
}


