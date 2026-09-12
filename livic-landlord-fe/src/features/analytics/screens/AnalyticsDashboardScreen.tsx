import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PageShell } from '@/src/components/common/layout/PageShell';
import {
  getAnalyticsSummary,
  getPortfolioOccupancy,
  getDefaultersList,
  getRecentSystemEvents,
  exportPortfolioCSV,
  SummaryResponse,
  PortfolioOccupancyResponse,
  DefaulterResponse,
  SystemEventItem,
} from '../api/analytics.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { StatCard } from '@/src/components/common/display/StatCard';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import Pagination from '@/src/components/common/navigation/Pagination';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useProperties } from '@/src/hooks/useProperties';
import { TrajectoryChart } from '../components/TrajectoryChart';
import { SystemEventsFeed } from '../components/SystemEventsFeed';
import { createStyles } from './AnalyticsDashboardScreen.styles';

export default function AnalyticsDashboardScreen() {
  const { theme, isDark } = useAppTheme();
  const { accessToken } = useAuth();
  const { isDesktop } = useResponsive();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [occupancy, setOccupancy] = useState<PortfolioOccupancyResponse[]>([]);
  const [defaulters, setDefaulters] = useState<DefaulterResponse[]>([]);
  const [events, setEvents] = useState<SystemEventItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { selectedPropertyId } = useGlobalPropertySelection();
  const { properties } = useProperties();
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const filteredOccupancy = useMemo(() => {
    if (!selectedPropertyId) return occupancy;
    return occupancy.filter(
      (o) => o.propertyId === selectedPropertyId || o.propertyName === selectedProperty?.name
    );
  }, [selectedPropertyId, occupancy, selectedProperty]);

  const filteredDefaulters = useMemo(() => {
    if (!selectedPropertyId) return defaulters;
    return defaulters.filter((d) => d.propertyName === selectedProperty?.name);
  }, [selectedPropertyId, defaulters, selectedProperty]);

  // Occupancy Pagination
  const [occupancyPage, setOccupancyPage] = useState(0);
  const OCCUPANCY_PER_PAGE = 4;
  const totalOccupancyPages = Math.ceil(filteredOccupancy.length / OCCUPANCY_PER_PAGE);
  const paginatedOccupancy = useMemo(() => {
    return filteredOccupancy.slice(
      occupancyPage * OCCUPANCY_PER_PAGE,
      (occupancyPage + 1) * OCCUPANCY_PER_PAGE
    );
  }, [filteredOccupancy, occupancyPage]);

  // Defaulters Pagination
  const [defaultersPage, setDefaultersPage] = useState(0);
  const DEFAULTERS_PER_PAGE = 4;
  const totalDefaultersPages = Math.ceil(filteredDefaulters.length / DEFAULTERS_PER_PAGE);
  const paginatedDefaulters = useMemo(() => {
    return filteredDefaulters.slice(
      defaultersPage * DEFAULTERS_PER_PAGE,
      (defaultersPage + 1) * DEFAULTERS_PER_PAGE
    );
  }, [filteredDefaulters, defaultersPage]);

  const styles = useMemo(() => createStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  // Fetch real analytics and occupancy data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!accessToken) {
        setLoading(false);
        setEventsLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);
        const [sumRes, occRes, defRes] = await Promise.all([
          getAnalyticsSummary(accessToken),
          getPortfolioOccupancy(accessToken),
          getDefaultersList(accessToken),
        ]);

        if (isMounted) {
          setSummary(
            sumRes || {
              expectedRevenue: 0,
              collectedRevenue: 0,
              collectionRate: 0,
              totalExpenses: 0,
              netProfit: 0,
            }
          );
          setOccupancy(occRes || []);
          setDefaulters(defRes || []);
        }
      } catch (e: any) {
        if (isMounted) {
          setErrorMsg(e.message || 'Failed to load live analytics');
        }
      } finally {
        if (isMounted) setLoading(false);
      }

      // Fetch live recent system events
      try {
        setEventsLoading(true);
        const recentEvents = await getRecentSystemEvents(accessToken);
        if (isMounted) {
          setEvents(recentEvents || []);
        }
      } catch (e) {
        // Non-blocking for events feed
      } finally {
        if (isMounted) setEventsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  // Aggregate Top 4 KPIs
  const totalUnits = useMemo(() => {
    return filteredOccupancy.reduce((acc, p) => acc + (p.totalUnits || 0), 0);
  }, [filteredOccupancy]);

  const activeTenants = useMemo(() => {
    return filteredOccupancy.reduce((acc, p) => acc + (p.occupiedUnits || 0), 0);
  }, [filteredOccupancy]);

  const avgOccupancy = useMemo(() => {
    if (totalUnits > 0) return (activeTenants / totalUnits) * 100;
    return summary?.collectionRate || 0;
  }, [totalUnits, activeTenants, summary]);

  const mrrProjected = summary?.expectedRevenue || 0;
  const mrrCollected = summary?.collectedRevenue || 0;

  if (loading) {
    return (
      <PageShell scrollable={false} edges={isDesktop ? ['top'] : []}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell
      scrollable={true}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >
      {/* Ecosystem Header with Export CSV CTA */}
      <View style={styles.headerContainer}>
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            Ecosystem Analytics
          </Text>
          <Text style={styles.screenSubtitle} numberOfLines={2}>
            Real-time portfolio intelligence, occupancy tracking & cash flow velocity
          </Text>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          activeOpacity={0.8}
          onPress={() => exportPortfolioCSV(summary, occupancy)}
        >
          <MaterialIcons name="file-download" size={18} color={theme.Colors.onSurface} />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Top KPI Cards */}
      <View style={styles.kpiGrid}>
        <StatCard
          label="Total Units"
          value={totalUnits > 0 ? totalUnits.toLocaleString() : '0'}
          helperText={`${filteredOccupancy.length} Properties registered`}
          iconName="apartment"
          iconColor={theme.Colors.primary}
          iconBg={`${theme.Colors.primary}18`}
        />

        <StatCard
          label="Active Tenants"
          value={activeTenants > 0 ? activeTenants.toLocaleString() : '0'}
          helperText={`${totalUnits > 0 ? ((activeTenants / totalUnits) * 100).toFixed(0) : 0}% capacity`}
          iconName="people"
          iconColor="#00e0ff"
          iconBg="rgba(0, 224, 255, 0.15)"
        />

        <StatCard
          label="Occupancy Rate"
          value={`${avgOccupancy.toFixed(1)}%`}
          helperText={avgOccupancy >= 80 ? 'Optimal capacity' : 'Available units'}
          trend={avgOccupancy >= 80 ? 'Healthy' : undefined}
          trendType="positive"
          iconName="pie-chart"
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.15)"
        />

        <StatCard
          label="MRR Projected"
          value={`₹${mrrProjected.toLocaleString('en-IN')}`}
          helperText={`₹${mrrCollected.toLocaleString('en-IN')} collected`}
          trend={`${summary?.collectionRate?.toFixed(1) || 0}% rate`}
          trendType={(summary?.collectionRate || 0) >= 80 ? 'positive' : 'neutral'}
          iconName="payments"
          iconColor="#a78bfa"
          iconBg="rgba(123, 44, 191, 0.15)"
        />
      </View>

      {/* 2-Column Section: Trajectory Chart & Real-Time System Events Feed */}
      <View style={styles.twoColumnSection}>
        <View style={styles.trajectoryCol}>
          <TrajectoryChart token={accessToken || ''} />
        </View>

        <View style={styles.eventsCol}>
          <SystemEventsFeed events={events} loading={eventsLoading} />
        </View>
      </View>

      {/* Breakdown Section: Property Occupancy & Overdue Cycles */}
      <View style={styles.breakdownSection}>
        {/* Occupancy & Yield Table */}
        <GlassCard style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Property Occupancy & Yield</Text>
          </View>

          {/* Table Header (Desktop only) */}
          {isDesktop && (
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>PROPERTY</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>
                OCCUPANCY
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>NET YIELD</Text>
            </View>
          )}

          {/* Occupancy Content */}
          {paginatedOccupancy.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant }}>
                No property data available.
              </Text>
            </View>
          ) : isDesktop ? (
            /* Desktop Tabular Grid */
            paginatedOccupancy.map((prop) => (
              <View key={prop.propertyId} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.tableCellName} numberOfLines={1}>
                    {prop.propertyName}
                  </Text>
                  <Text style={styles.tableCellSub} numberOfLines={1}>
                    {prop.occupiedUnits} / {prop.totalUnits} Units
                  </Text>
                </View>

                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  <Text style={styles.tableCellText}>
                    {prop.occupancyRate !== undefined ? `${prop.occupancyRate.toFixed(1)}%` : '0.0%'}
                  </Text>
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={styles.yieldBadge}>
                    <Text style={styles.yieldBadgeText}>
                      {prop.netYield !== undefined ? `${prop.netYield.toFixed(1)}%` : '0.0%'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            /* Mobile Apple Entity Cards */
            <View style={styles.mobileCardList}>
              {paginatedOccupancy.map((prop) => (
                <View key={prop.propertyId} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text style={styles.mobileCardTitle} numberOfLines={1}>
                      {prop.propertyName}
                    </Text>
                    <View style={styles.yieldBadge}>
                      <Text style={styles.yieldBadgeText}>
                        Yield {prop.netYield !== undefined ? `${prop.netYield.toFixed(1)}%` : '0.0%'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.mobileCardSub}>
                      {prop.occupiedUnits} of {prop.totalUnits} Units Occupied
                    </Text>
                    <Text style={[styles.mobileCardSub, { fontWeight: '600', color: theme.Colors.primary }]}>
                      {prop.occupancyRate !== undefined ? `${prop.occupancyRate.toFixed(1)}%` : '0.0%'}
                    </Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, prop.occupancyRate || 0))}%`,
                          backgroundColor: theme.Colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {totalOccupancyPages > 1 && (
            <Pagination
              page={occupancyPage}
              totalPages={totalOccupancyPages}
              onPageChange={setOccupancyPage}
            />
          )}
        </GlassCard>

        {/* Overdue Rent Accounts */}
        {filteredDefaulters.length > 0 && (
          <GlassCard style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.Colors.error }]}>
                Overdue Rent Accounts ({filteredDefaulters.length})
              </Text>
            </View>

            {/* Desktop Table Header */}
            {isDesktop && (
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>RESIDENT / UNIT</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>
                  DAYS OVERDUE
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
              </View>
            )}

            {isDesktop ? (
              paginatedDefaulters.map((def, idx) => (
                <View key={def.rentCycleId || idx} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tableCellName} numberOfLines={1}>
                      {def.tenantName}
                    </Text>
                    <Text style={styles.tableCellSub} numberOfLines={1}>
                      Unit {def.unitNumber} • {def.propertyName}
                    </Text>
                  </View>

                  <View style={{ flex: 1.2, alignItems: 'center' }}>
                    <Text style={[styles.tableCellText, { color: theme.Colors.error }]}>
                      {def.daysOverdue} days
                    </Text>
                  </View>

                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[styles.tableCellText, { fontWeight: '600' }]}>
                      ₹{def.amountDue?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              /* Mobile Overdue Entity Cards */
              <View style={styles.mobileCardList}>
                {paginatedDefaulters.map((def, idx) => (
                  <View key={def.rentCycleId || idx} style={styles.mobileCard}>
                    <View style={styles.mobileCardHeader}>
                      <Text style={styles.mobileCardTitle} numberOfLines={1}>
                        {def.tenantName}
                      </Text>
                      <Text style={[styles.mobileCardTitle, { color: theme.Colors.primary }]}>
                        ₹{def.amountDue?.toLocaleString()}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.mobileCardSub} numberOfLines={1}>
                        Unit {def.unitNumber} • {def.propertyName}
                      </Text>
                      <View style={[styles.yieldBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                        <Text style={[styles.yieldBadgeText, { color: theme.Colors.error }]}>
                          {def.daysOverdue} days overdue
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {totalDefaultersPages > 1 && (
              <Pagination
                page={defaultersPage}
                totalPages={totalDefaultersPages}
                onPageChange={setDefaultersPage}
              />
            )}
          </GlassCard>
        )}
      </View>
    </PageShell>
  );
}
