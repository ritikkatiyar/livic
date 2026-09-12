import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { PageShell } from '@/src/components/common/layout/PageShell';
import ActionButton from '@/src/components/common/inputs/ActionButton';

// Phase 4 modular hook & component imports
import { useInventory, type InventoryTab } from '@/src/features/inventory/hooks/useInventory';
import { InventoryRegistryView } from '@/src/features/inventory/components/InventoryRegistryView';
import { InventoryMoveInView } from '@/src/features/inventory/components/InventoryMoveInView';
import { InventoryMoveOutView } from '@/src/features/inventory/components/InventoryMoveOutView';

export default function InventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();

  const {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    serviceOnly,
    setServiceOnly,
    filteredItems,
    totalDeductions,
    securityDeposit,
    netRefund,
    leaseId
  } = useInventory();

  const TABS: { id: InventoryTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { id: 'registry', label: 'Registry',   icon: 'inventory-2'  },
    { id: 'moveIn',   label: 'Move-In',    icon: 'how-to-reg'   },
    { id: 'moveOut',  label: 'Settlement', icon: 'receipt-long' },
  ];

  return (
    <PageShell scrollable={true} contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}>
      {/* Desktop page header */}
      {isDesktop && (
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.kicker}>Inventory Lifecycle</Text>
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
            onPress={() => {}}
          />
        </View>
      )}

      {/* Mobile search + add row */}
      {!isDesktop && (
        <View style={styles.mobileTopBar}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              value={query} 
              onChangeText={setQuery}
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
            onPress={() => {}}
          >
            <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tab, 
                active && (t.id === 'moveOut' ? styles.tabActiveError : styles.tabActivePrimary)
              ]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.75}
            >
              <MaterialIcons 
                name={t.icon} 
                size={16} 
                color={active ? theme.Colors.surfaceContainerLowest : theme.Colors.onSurfaceVariant} 
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Desktop search for registry */}
      {isDesktop && activeTab === 'registry' && (
        <View style={styles.desktopSearchRow}>
          <View style={[styles.searchBox, { maxWidth: 420 }]}>
            <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              value={query} 
              onChangeText={setQuery}
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
          isDesktop={isDesktop}
          serviceOnly={serviceOnly}
          onToggleService={() => setServiceOnly(v => !v)}
        />
      )}
      {activeTab === 'moveIn'  && <InventoryMoveInView isDesktop={isDesktop} />}
      {activeTab === 'moveOut' && (
        <InventoryMoveOutView
          isDesktop={isDesktop}
          securityDeposit={securityDeposit}
          totalDeductions={totalDeductions}
          netRefund={netRefund}
        />
      )}
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  scroll: { 
    padding: theme.Spacing.md, 
    paddingBottom: 120, 
    gap: theme.Spacing.md 
  },
  scrollDesktop: { 
    padding: theme.Spacing.xl, 
    maxWidth: 1280, 
    width: '100%', 
    alignSelf: 'center' 
  },
  pageHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    gap: theme.Spacing.md, 
    marginBottom: theme.Spacing.sm 
  },
  kicker: { 
    fontSize: theme.Typography.labelSmall.fontSize, 
    fontWeight: '600', 
    letterSpacing: 0.5, 
    color: theme.Colors.primary 
  },
  title: { 
    fontSize: theme.Typography.headlineLg.fontSize, 
    fontWeight: '700', 
    color: theme.Colors.onSurface, 
    lineHeight: 38, 
    marginTop: theme.Spacing.xs 
  },
  subtitle: { 
    fontSize: theme.Typography.bodyLarge.fontSize, 
    color: theme.Colors.onSurfaceVariant, 
    marginTop: theme.Spacing.sm, 
    lineHeight: 22, 
    maxWidth: 600 
  },
  contextLine: { 
    color: theme.Colors.primary, 
    fontSize: theme.Typography.bodySmall.fontSize, 
    fontWeight: '600', 
    marginTop: 6 
  },
  mobileTopBar: { 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'center' 
  },
  addIconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: theme.Rounded.md, 
    backgroundColor: theme.Colors.primary,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  searchBox: {
    flex: 1, 
    height: 44, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLowest, 
    borderRadius: theme.Rounded.md,
    borderWidth: 1, 
    borderColor: theme.Colors.outline, 
    paddingHorizontal: 12, 
    gap: theme.Spacing.sm,
  },
  searchInput: { 
    flex: 1, 
    fontSize: theme.Typography.bodyMedium.fontSize, 
    color: theme.Colors.onSurface 
  },
  desktopSearchRow: { 
    marginBottom: theme.Spacing.xs 
  },
  tabBar: { 
    flexDirection: 'row', 
    gap: theme.Spacing.sm 
  },
  tab: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 7,
    height: 40, 
    paddingHorizontal: theme.Spacing.md, 
    borderRadius: theme.Rounded.full,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1, 
    borderColor: theme.Colors.outline, 
    overflow: 'hidden',
  },
  tabActivePrimary: { 
    backgroundColor: theme.Colors.primary, 
    borderColor: theme.Colors.primary 
  },
  tabActiveError: { 
    backgroundColor: theme.Colors.error, 
    borderColor: theme.Colors.error 
  },
  tabText: { 
    fontSize: theme.Typography.bodyMedium.fontSize, 
    fontWeight: '500', 
    color: theme.Colors.onSurfaceVariant 
  },
  tabTextActive: { 
    color: theme.Colors.surfaceContainerLowest,
    fontWeight: '600',
  },
});
