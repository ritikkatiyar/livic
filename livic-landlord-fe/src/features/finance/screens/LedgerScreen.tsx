import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useLedger } from '@/src/features/finance/hooks/useLedger';

import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';

// Sub-components
import { LedgerTable } from '../components/billing/LedgerTable';

export default function LedgerScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const validParamId = (paramPropertyId && paramPropertyId !== 'null' && paramPropertyId !== 'undefined') ? paramPropertyId : null;
  const propertyId = selectedPropertyId || validParamId || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Pagination and Date Filter States
  const [page, setPage] = useState(0);
  const [accumulatedLedger, setAccumulatedLedger] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');

  // React-Query Custom Hook
  const {
    ledger,
    totalPages,
    isLoading,
  } = useLedger(propertyId, page, fromDate, toDate, debouncedSearchQuery, token);

  useEffect(() => {
    setPage(0);
    setAccumulatedLedger([]);
  }, [propertyId, fromDate, toDate, debouncedSearchQuery]);

  useEffect(() => {
    if (ledger && ledger.length > 0) {
      setAccumulatedLedger(prev => {
        if (page === 0) {
          if (prev.length === ledger.length && prev.every((item: any, idx: number) => item.id === ledger[idx]?.id)) {
            return prev;
          }
          return ledger;
        }
        const existingIds = new Set(prev.map((i: any) => i.id));
        const newItems = ledger.filter((i: any) => !existingIds.has(i.id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });
    }
  }, [ledger, page]);

  const handleEndReached = () => {
    if (page + 1 < totalPages && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    setAccumulatedLedger([]);
    setFromDate(fromDateInput);
    setToDate(toDateInput);
  };

  const handleClearFilters = () => {
    setPage(0);
    setAccumulatedLedger([]);
    setFromDateInput('');
    setToDateInput('');
    setFromDate('');
    setToDate('');
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderGlassyHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <View style={styles.headerContent}>
        <View style={styles.titleWrapper}>
          <Text style={styles.compactTitleText}>Finance Ledger</Text>
        </View>
      </View>
    </View>
  );

  const renderSearchBox = () => (
    <View style={styles.searchBox}>
      <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Apt, Tenant name, or Description..."
        placeholderTextColor={theme.Colors.onSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDateFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.dateInputContainer}>
        <Text style={styles.filterLabel}>From:</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.Colors.onSurfaceVariant}
          value={fromDateInput}
          onChangeText={setFromDateInput}
        />
      </View>
      <View style={styles.dateInputContainer}>
        <Text style={styles.filterLabel}>To:</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.Colors.onSurfaceVariant}
          value={toDateInput}
          onChangeText={setToDateInput}
        />
      </View>
      <View style={styles.filterButtonsRow}>
        <ActionButton label="Apply" variant="primary" size="sm" onPress={handleApplyFilters} />
        {(fromDate || toDate || fromDateInput || toDateInput) ? (
          <TouchableOpacity onPress={handleClearFilters} style={styles.clearFilterButton}>
            <MaterialIcons name="clear" size={16} color={theme.Colors.onSurfaceVariant} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity
          onPress={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
        >
          <MaterialIcons name="chevron-left" size={24} color={page === 0 ? '#b0bec5' : theme.Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.pageText}>
          Page {page + 1} of {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={[styles.pageButton, page >= totalPages - 1 && styles.pageButtonDisabled]}
        >
          <MaterialIcons name="chevron-right" size={24} color={page >= totalPages - 1 ? '#b0bec5' : theme.Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDesktopContent = () => (
    <View style={styles.desktopInner}>
      <View style={styles.desktopHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/expenses')}
            style={{ marginRight: 14, padding: 8, borderRadius: 12, backgroundColor: theme.Colors.glassFill, borderWidth: 1, borderColor: theme.Colors.glassStroke }}
            activeOpacity={0.75}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
          </TouchableOpacity>
          <View style={styles.largeTitleContainer}>
            <Text style={styles.titleLineDesktop}>Property General Ledger</Text>
            <Text style={styles.desktopSubtitle}>Reconcile billing outputs, dynamic interest logs, cash settle records & security collections</Text>
          </View>
        </View>
      </View>

      <View style={styles.desktopFilterRow}>
        <View style={{ flex: 1, minWidth: 260 }}>
          {renderSearchBox()}
        </View>
        <View style={{ minWidth: 360 }}>
          {renderDateFilters()}
        </View>
      </View>

      {!propertyId ? (
        <PropertyRequiredBanner
          title="Select Property to View Ledger"
          description="Accounting entries, payments, and receivables are organized per property. Select a property to view transactions."
          icon="account-balance-wallet"
          properties={properties}
          selectedPropertyId={propertyId}
          onSelectProperty={setSelectedPropertyId}
        />
      ) : (
        <LedgerTable
          ledger={accumulatedLedger}
          properties={properties}
          isLoading={isLoading && accumulatedLedger.length === 0}
          isDesktop={isDesktop}
          isDark={isDark}
        />
      )}

      {page + 1 < totalPages && (
        <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 0.5 }}>
            Scroll down to load more ledger entries...
          </Text>
        </View>
      )}
    </View>
  );

  const renderMobileContent = () => (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
        <Text style={styles.screenTitle}>General Ledger</Text>
        <Text style={styles.screenSubtitle}>View all dynamic billing transactions and record collections</Text>
      </Animated.View>

      {renderSearchBox()}
      {renderDateFilters()}

      <LedgerTable
        ledger={accumulatedLedger}
        properties={properties}
        isLoading={isLoading && accumulatedLedger.length === 0}
        isDesktop={isDesktop}
        isDark={isDark}
      />

      {page + 1 < totalPages && (
        <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 0.5 }}>
            Scroll down to load more ledger entries...
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <PageShell scrollable edges={isDesktop ? ['top'] : []} onEndReached={handleEndReached}>
      {isDesktop ? renderDesktopContent() : renderMobileContent()}
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: { flex: 1, alignItems: 'center' },
  compactTitleText: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  desktopScroll: { paddingVertical: theme.Spacing.lg, paddingHorizontal: 40, alignItems: 'center' },
  mobileScroll: { paddingVertical: 10, paddingHorizontal: 20 },
  desktopInner: { width: '100%', maxWidth: 1080, paddingTop: theme.Spacing.lg },
  titleContainer: { marginTop: 10, marginBottom: 20 },
  screenTitle: {
    ...theme.Typography.headlineLg,
    color: theme.Colors.onSurface,
  },
  screenSubtitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
    fontWeight: '600',
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 12,
    gap: 10,
    marginBottom: theme.Spacing.md,
  },
  searchInput: { flex: 1, color: theme.Colors.onSurface, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    marginBottom: theme.Spacing.md,
  },
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  dateInput: {
    width: 110,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    color: theme.Colors.onSurface,
    paddingHorizontal: 10,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm },
  filterButton: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: theme.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    color: theme.Surface.card,
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  clearFilterButton: {
    minWidth: 44,
    minHeight: 44,
    padding: theme.Spacing.sm,
    borderRadius: 22,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  largeTitleContainer: { flex: 1 },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  desktopSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
    fontWeight: '600',
  },
  desktopFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: theme.Spacing.lg,
    zIndex: 10,
  },
});
