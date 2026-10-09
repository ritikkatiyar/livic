import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useResponsive } from '@/src/hooks/useResponsive';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { listRentCycles, RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createStyles } from './ReportsScreen.styles';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatCard } from '@/src/components/common/display/StatCard';
import { SkeletonRow } from '@/src/components/common/feedback/Skeleton';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Overdue', value: 'OVERDUE' },
];

export default function ReportsScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const { accessToken } = useAuth();
  const { selectedPropertyId } = useGlobalPropertySelection();
  const { properties } = useProperties();

  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [statements, setStatements] = useState<RentCycleResponse[]>([]);
  const [accumulatedStatements, setAccumulatedStatements] = useState<RentCycleResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingDraftsCount, setPendingDraftsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadStatements = useCallback(
    async (pageToLoad: number) => {
      if (!accessToken) return;
      if (pageToLoad === 0) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      try {
        const res = await listRentCycles(
          billingMonth,
          accessToken,
          selectedPropertyId || undefined,
          pageToLoad,
          pageSize,
          statusFilter !== 'ALL' ? statusFilter : undefined,
          searchQuery.trim() || undefined
        );

        let filtered = res.content || [];

        setStatements(filtered);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 1);
        setPage(pageToLoad);

        if (pageToLoad === 0) {
          setAccumulatedStatements(filtered);
        } else {
          setAccumulatedStatements((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newUnique = filtered.filter((s) => !existingIds.has(s.id));
            return [...prev, ...newUnique];
          });
        }

        setTotalRevenue(res.totalExpectedRevenue || 0);
        setPublishedCount(res.publishedCount || 0);
        setPendingDraftsCount(res.pendingDraftsCount || 0);
      } catch (err: any) {
        console.warn('[Reports] Failed to fetch cycles:', err.message);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [accessToken, billingMonth, selectedPropertyId, statusFilter, searchQuery]
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && page + 1 < totalPages) {
      loadStatements(page + 1);
    }
  }, [isLoading, isFetchingMore, page, totalPages, loadStatements]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadStatements(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadStatements]);

  const adjustMonth = (delta: number) => {
    const [y, m] = billingMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    setBillingMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleOpenStatement = async (cycleId: string) => {
    try {
      const html = await fetchStatementHtml(cycleId, accessToken || '');
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        await WebBrowser.openBrowserAsync(
          `data:text/html,${encodeURIComponent(html)}`
        );
      }
    } catch (err: any) {
      console.warn('[Reports] Error opening statement:', err.message);
    }
  };

  const totalCollected = useMemo(() => {
    return statements
      .filter((s) => s.status === 'PAID')
      .reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [statements]);

  return (
    <PageShell
      scrollable
      onEndReached={handleLoadMore}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {/* Page Header */}
      <View style={[styles.pageHeader, isDesktop && styles.pageHeaderDesktop]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageKicker}>FINANCIAL INTELLIGENCE</Text>
          <Text style={styles.pageTitle}>Financial Reports</Text>
          <Text style={styles.pageSubtitle}>
            Audit monthly rent collections, inspect published statements, and track billing health.
          </Text>
        </View>
      </View>

      {/* KPI Stats Overview */}
      <View style={[styles.kpiRow, isDesktop && styles.kpiRowDesktop]}>
        <StatCard
          label="Statements"
          value={totalElements}
          loading={isLoading}
          helperText={`for ${billingMonth}`}
          iconName="receipt-long"
          iconColor={theme.Colors.primary}
          valueColor={theme.Colors.primary}
          style={isDesktop ? { flex: 1 } : styles.kpiCardMobile}
        />
        <StatCard
          label="Total Billed"
          value={`₹${totalRevenue.toLocaleString()}`}
          loading={isLoading}
          helperText={`${publishedCount} published`}
          iconName="payments"
          iconColor={theme.Colors.secondary}
          valueColor={isDark ? theme.Colors.secondary : theme.Colors.secondary}
          style={isDesktop ? { flex: 1 } : styles.kpiCardMobile}
        />
        <StatCard
          label="Collected"
          value={`₹${totalCollected.toLocaleString()}`}
          loading={isLoading}
          helperText={`${statements.filter((s) => s.status === 'PAID').length} paid`}
          iconName="check-circle"
          iconColor={theme.Colors.tertiary}
          valueColor={theme.Colors.tertiary}
          style={isDesktop ? { flex: 1 } : styles.kpiCardMobile}
        />
        <StatCard
          label="Pending"
          value={pendingDraftsCount}
          loading={isLoading}
          helperText={`${pendingDraftsCount} drafts`}
          iconName="pending"
          iconColor={theme.Colors.tertiary}
          valueColor={theme.Colors.tertiary}
          style={isDesktop ? { flex: 1 } : styles.kpiCardMobile}
        />
      </View>

      {/* Header & Filter Controls Card */}
      <GlassCard style={styles.glassCard}>
        <View style={styles.headerRow}>
          <View style={styles.titleSection}>
            <Text style={styles.kicker}>STATEMENTS & AUDIT</Text>
            <Text style={styles.sectionTitle}>Monthly Statements</Text>
            <Text style={styles.sectionSubtitle}>
              Select property and month to inspect and download tenant invoices
            </Text>
          </View>

          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => adjustMonth(-1)} style={styles.monthArrow}>
              <MaterialIcons name="chevron-left" size={22} color={theme.Colors.primary} />
            </TouchableOpacity>
            <View style={styles.monthLabelWrapper}>
              <MaterialIcons name="calendar-today" size={14} color={theme.Colors.primary} />
              <Text style={styles.monthLabel}>
                {new Date(billingMonth + '-02').toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => adjustMonth(1)} style={styles.monthArrow}>
              <MaterialIcons name="chevron-right" size={22} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Status Filters */}
        <View style={[styles.filterControlsRow, isDesktop && styles.filterControlsRowDesktop]}>
          <View style={[styles.searchBox, isDesktop && styles.searchBoxDesktop]}>
            <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by tenant name or unit..."
              placeholderTextColor={theme.Colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusChipsScroll}
            style={styles.statusChipsContainer}
          >
            {STATUS_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={statusFilter === opt.value}
                onPress={() => setStatusFilter(opt.value)}
              />
            ))}
          </ScrollView>
        </View>
      </GlassCard>

      {/* Statements List Table / Cards */}
      <GlassCard style={[styles.listCard, isDesktop && styles.listCardDesktop]}>
        {isLoading ? (
          <View style={{ gap: 12, paddingVertical: 12 }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : accumulatedStatements.length > 0 ? (
          <View style={styles.table}>
            {/* Desktop Table Header */}
            {isDesktop && (
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2.2 }]}>Tenant Name</Text>
                <Text style={[styles.headerCell, { flex: 1.2 }]}>Unit</Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>
                  Total Billed
                </Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>
                  Amount Paid
                </Text>
                <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>
                  Due Date
                </Text>
                <Text style={[styles.headerCell, { flex: 1.4, textAlign: 'center' }]}>
                  Status
                </Text>
                <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>
                  Statement
                </Text>
              </View>
            )}

            {accumulatedStatements.map((stmt) => (
              <View key={stmt.id} style={[styles.row, !isDesktop && styles.rowMobile]}>
                {isDesktop ? (
                  // Desktop Layout
                  <>
                    <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.tenantAvatar}>
                        <Text style={styles.tenantAvatarText}>
                          {(stmt.tenantName || 'T').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.cell, { fontWeight: '700' }]}>{stmt.tenantName}</Text>
                    </View>
                    <Text style={[styles.cell, { flex: 1.2 }]}>Unit {stmt.unitNumber}</Text>
                    <Text style={[styles.cell, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>
                      ₹{stmt.totalAmount?.toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { flex: 1.5, textAlign: 'right', color: stmt.paidAt ? theme.Colors.success : theme.Colors.onSurfaceVariant },
                      ]}
                    >
                      ₹{stmt.paidAt ? stmt.totalAmount?.toLocaleString() : '0.00'}
                    </Text>
                    <Text style={[styles.cell, { flex: 1.2, textAlign: 'center', color: theme.Colors.onSurfaceVariant }]}>
                      {stmt.dueDate ? new Date(stmt.dueDate).toLocaleDateString() : 'N/A'}
                    </Text>
                    <View style={{ flex: 1.4, alignItems: 'center', justifyContent: 'center' }}>
                      <StatusPill status={stmt.status} />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleOpenStatement(stmt.id)}
                      style={styles.downloadBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="download" size={20} color={theme.Colors.primary} />
                      <Text style={styles.downloadBtnText}>PDF</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Mobile Layout
                  <View style={styles.mobileCard}>
                    <View style={styles.mobileCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={styles.tenantAvatar}>
                          <Text style={styles.tenantAvatarText}>
                            {(stmt.tenantName || 'T').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.mobileTenantName}>{stmt.tenantName}</Text>
                          <Text style={styles.mobileDetailLabel}>Unit {stmt.unitNumber}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleOpenStatement(stmt.id)}
                        style={styles.downloadBtn}
                      >
                        <MaterialIcons name="download" size={18} color={theme.Colors.primary} />
                        <Text style={styles.downloadBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.mobileCardDetail}>
                      <StatusPill status={stmt.status} />
                      <Text style={styles.mobileDueDate}>
                        Due: {stmt.dueDate ? new Date(stmt.dueDate).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.mobileAmountsRow}>
                      <Text style={styles.mobileAmount}>
                        Billed: ₹{stmt.totalAmount?.toLocaleString()}
                      </Text>
                      <Text
                        style={[
                          styles.mobileAmount,
                          { color: stmt.paidAt ? theme.Colors.success : theme.Colors.onSurfaceVariant },
                        ]}
                      >
                        Paid: ₹{stmt.paidAt ? stmt.totalAmount?.toLocaleString() : '0.00'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {isFetchingMore && <ActivityIndicator color={theme.Colors.primary} style={{ marginVertical: 14 }} />}
          </View>
        ) : (
          <EmptyState
            title="No Statements Found"
            description={`No billing statements found matching your filter criteria for ${billingMonth}.`}
            iconName="receipt-long"
          />
        )}
      </GlassCard>
    </PageShell>
  );
}
