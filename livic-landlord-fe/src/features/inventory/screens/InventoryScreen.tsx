import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useResponsive } from '@/src/hooks/useResponsive';

import { useInventory, type InventoryTab } from '@/src/features/inventory/hooks/useInventory';
import { InventoryRegistryView } from '@/src/features/inventory/components/InventoryRegistryView';
import { InventoryMoveInView } from '@/src/features/inventory/components/InventoryMoveInView';
import { InventoryMoveOutView } from '@/src/features/inventory/components/InventoryMoveOutView';
import { AddItemModal } from '@/src/features/inventory/components/AddItemModal';

import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { useRouter } from 'expo-router';

export default function InventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const { showToast } = useToast();

  const {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    serviceOnly,
    setServiceOnly,
    filteredItems,
    rawItems,
    assignmentItems,
    verificationItems,
    stats,
    totalDeductions,
    securityDeposit,
    netRefund,
    leaseId,
    propertyId,
    properties,
    setSelectedPropertyId,
    refresh,
    isAddModalOpen,
    setIsAddModalOpen,
    accessToken,
  } = useInventory();

  const handleOpenAddModal = () => {
    if (!propertyId) {
      showToast("Please select a property from the top navbar selector first.", "info");
      return;
    }
    setIsAddModalOpen(true);
  };

  const TABS: { id: InventoryTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { id: 'registry', label: 'Registry',   icon: 'inventory-2'  },
    { id: 'moveIn',   label: 'Move-In',    icon: 'how-to-reg'   },
    { id: 'moveOut',  label: 'Settlement', icon: 'receipt-long' },
  ];

  return (
    <PageShell
      scrollable={true}
      onEndReached={refresh}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
    >

          {/* Desktop page header */}
          {isDesktop && (
            <View style={styles.pageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>INVENTORY LIFECYCLE</Text>
                <Text style={styles.title}>Property Inventory</Text>
                <Text style={styles.subtitle}>
                  Track move-in assignment, condition evidence, verification and deposit settlement.
                </Text>
                {leaseId && <Text style={styles.contextLine}>Lease: {leaseId}</Text>}
              </View>
              <ActionButton
                label="Add Item"
                icon="add"
                variant="primary"
                size="md"
                onPress={handleOpenAddModal}
              />
            </View>
          )}

          {/* Mobile search + add row */}
          {!isDesktop && (
            <View style={styles.mobileTopBar}>
              <View style={styles.searchBox}>
                  <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
                  <TextInput
                    value={query} onChangeText={setQuery}
                    placeholder="Search inventory..."
                    placeholderTextColor={theme.Colors.onSurfaceVariant}
                    style={styles.searchInput}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addIconBtn}
                  activeOpacity={0.82}
                  onPress={handleOpenAddModal}
                >
                  <View style={styles.addIconBtnInner}>
                    <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
                  </View>
                </TouchableOpacity>
              </View>
          )}

          {/* Tab selector */}
          <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
            {TABS.map((t) => (
              <FilterPill
                key={t.id}
                label={t.label}
                icon={t.icon}
                active={activeTab === t.id}
                onPress={() => setActiveTab(t.id)}
              />
            ))}
          </View>

          {!propertyId ? (
            <PropertyRequiredBanner
              title="Select Property for Inventory & Assets"
              description="Track property assets, assign items to units, and run move-in checklists by selecting a property below."
              icon="inventory"
              properties={properties}
              selectedPropertyId={propertyId}
              onSelectProperty={setSelectedPropertyId}
            />
          ) : (
            <>
              {/* Desktop search for registry */}
              {isDesktop && activeTab === 'registry' && (
                <View style={styles.desktopSearchRow}>
                  <View style={[styles.searchBox, { maxWidth: 420 }]}>
                    <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
                    <TextInput
                      value={query} onChangeText={setQuery}
                      placeholder="Search inventory..."
                      placeholderTextColor={theme.Colors.onSurfaceVariant}
                      style={styles.searchInput}
                    />
                  </View>
                </View>
              )}

              {activeTab === 'registry' && (
                <InventoryRegistryView
                  items={filteredItems}
                  totalCount={rawItems.length}
                  stats={stats}
                  isDesktop={isDesktop}
                  serviceOnly={serviceOnly}
                  onToggleService={() => setServiceOnly(v => !v)}
                  onAddItem={handleOpenAddModal}
                />
              )}
              {activeTab === 'moveIn' && (
                <InventoryMoveInView
                  assignedItems={assignmentItems}
                  availableItems={rawItems}
                  leaseId={leaseId}
                  token={accessToken}
                  isDesktop={isDesktop}
                  onRefresh={refresh}
                  onAddItem={handleOpenAddModal}
                />
              )}
              {activeTab === 'moveOut' && (
                <InventoryMoveOutView
                  items={verificationItems}
                  leaseId={leaseId}
                  isDesktop={isDesktop}
                  securityDeposit={securityDeposit}
                  totalDeductions={totalDeductions}
                  netRefund={netRefund}
                  onRefresh={refresh}
                />
              )}
            </>
          )}
      {propertyId && accessToken && (
        <AddItemModal
          visible={isAddModalOpen}
          propertyId={propertyId}
          token={accessToken}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refresh}
        />
      )}
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { gap: theme.Spacing.md },
  scrollDesktop: { paddingTop: 24, paddingHorizontal: 32, paddingBottom: 40, width: '100%' },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.Spacing.md, marginBottom: theme.Spacing.sm },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', letterSpacing: 0.2, color: theme.Colors.primary },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,104,117,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  propertyBadgeText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: theme.Colors.primary },
  title: { ...theme.Typography.headlineLg, color: theme.Colors.onSurface, lineHeight: 38, marginTop: theme.Spacing.xs },
  subtitle: { fontSize: theme.Typography.bodyLarge.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm, lineHeight: 22, maxWidth: 600 },
  contextLine: { color: theme.Colors.primary, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', marginTop: 6 },
  addBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: theme.Spacing.sm },
  addBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },

  mobileTopBar: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  mobileBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconBtn: { width: 46, height: 46, borderRadius: 14, overflow: 'hidden' },
  addIconBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.primary,
    borderRadius: 14,
  },

  searchBox: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    paddingHorizontal: 14,
    gap: theme.Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  desktopSearchRow: { marginBottom: theme.Spacing.xs },

  tabBar: { flexDirection: 'row', gap: theme.Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 40, paddingHorizontal: theme.Spacing.md, borderRadius: 100,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1, borderColor: theme.Colors.outline, overflow: 'hidden',
  },
  tabActive: { borderWidth: 0 },
  tabText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant },
  tabTextActive: { color: theme.Colors.surfaceContainerLowest, fontWeight: '600' },
});
