import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useIssues } from '@/src/features/issues/hooks/useIssues';
import { useProperties } from '@/src/hooks/useProperties';
import { StatCard } from '@/src/components/common/display/StatCard';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { BlockFilterPills } from '@/src/components/common/inputs/BlockFilterPills';
import IssueDetailModal from '@/src/features/issues/components/IssueDetailModal';
import Pagination from '@/src/components/common/navigation/Pagination';
import { useResponsive } from '@/src/hooks/useResponsive';
import { createStyles } from './EscalationsScreen.styles';
import { IssueFiltersSheet } from '../components/IssueFiltersSheet';
import { ISSUE_PRIORITY_OPTIONS, ISSUE_STATUS_OPTIONS, issueFilterLabel } from '../utils/issueFilters';

export default function EscalationsScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const countColor = (count: number, color: string) => (count > 0 ? color : theme.Colors.onSurfaceVariant);
  // Let the filter chip rows run to the right screen edge on mobile so they clearly scroll
  const chipRowBleed = { flex: 1, marginRight: -theme.Spacing.containerPadding };
  const chipRowBleedContent = { paddingRight: theme.Spacing.containerPadding };

  const { accessToken } = useAuth();
  const { properties } = useProperties();

  const {
    issues,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    propertyFilter,
    setPropertyFilter,
    blockFilter,
    setBlockFilter,
    metrics,
    refresh,
  } = useIssues(accessToken);

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [
    statusFilter !== 'ALL' && { key: 'status', label: issueFilterLabel(ISSUE_STATUS_OPTIONS, statusFilter), clear: () => setStatusFilter('ALL') },
    priorityFilter !== 'ALL' && { key: 'priority', label: issueFilterLabel(ISSUE_PRIORITY_OPTIONS, priorityFilter), clear: () => setPriorityFilter('ALL') },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  // Set default property selection if none active
  useEffect(() => {
    if (!propertyFilter && properties && properties.length > 0) {
      setPropertyFilter(properties[0].id);
    }
  }, [properties, propertyFilter, setPropertyFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: theme.Colors.errorContainer, text: theme.Colors.error };
      case 'HIGH':
        return { bg: theme.Colors.tertiaryContainer, text: theme.Colors.tertiary };
      case 'STANDARD':
        return { bg: theme.Colors.primaryContainer, text: theme.Colors.primary };
      default:
        return { bg: theme.Colors.surfaceContainerHigh, text: theme.Colors.onSurfaceVariant };
    }
  };

  const getStatusColor = (status: string, escStatus?: string) => {
    if (escStatus === 'ESCALATED') {
      return { bg: theme.Colors.error + '22', text: theme.Colors.error, label: 'ESCALATED' };
    }
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: theme.Colors.primary + '22', text: theme.Colors.primary, label: status };
      case 'IN_PROGRESS':
        return { bg: theme.Colors.secondary + '22', text: theme.Colors.secondary, label: 'IN PROGRESS' };
      default:
        return { bg: theme.Colors.tertiary + '22', text: theme.Colors.tertiary, label: 'OPEN' };
    }
  };

  return (
    <PageShell
      scrollable={true}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={isDesktop ? styles.desktopScroll : styles.mobileScroll}
    >
      <View style={isDesktop ? styles.desktopInner : null}>
        {/* Header Titles */}
        <View style={[styles.titleContainer, !isDesktop && styles.titleContainerMobile]}>
          <Text style={styles.kicker}>MAINTENANCE & SAFETY</Text>
          <Text style={isDesktop ? styles.titleLineDesktop : styles.titleLineMobile}>Escalations & Issues</Text>
          <Text style={styles.subtitle}>
            Track resident maintenance reports, safety alerts, and SLA violations.
          </Text>
        </View>

        {/* Metrics Dashboard Row: status colours only when there is something to act on, never for a zero */}
        <View style={styles.metricsRow}>
          <StatCard
            label="Total Tickets"
            value={metrics.total}
            loading={isLoading}
            iconName="confirmation-number"
            iconColor={theme.Colors.primary}
            valueColor={theme.Colors.onSurface}
            style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
          />
          <StatCard
            label="Open Issues"
            value={metrics.open}
            loading={isLoading}
            iconName="error-outline"
            iconColor={theme.Colors.secondary}
            valueColor={theme.Colors.secondary}
            style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
          />
            <StatCard
              label="In Progress"
              value={metrics.inProgress}
              loading={isLoading}
              iconName="pending-actions"
              iconColor={countColor(metrics.inProgress, theme.Colors.tertiary)}
              valueColor={countColor(metrics.inProgress, theme.Colors.tertiary)}
              style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            />
            <StatCard
              label="Escalated"
              value={metrics.escalated}
              loading={isLoading}
              iconName="warning"
              iconColor={countColor(metrics.escalated, theme.Colors.error)}
              valueColor={countColor(metrics.escalated, theme.Colors.error)}
              style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            />
          </View>

          {/* Multi-Block Filter Pills */}
          <BlockFilterPills
            propertyId={propertyFilter}
            selectedBlockId={blockFilter}
            onSelectBlockId={setBlockFilter}
          />

          {/* Search Box */}
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ticket #, title, or description..."
              placeholderTextColor={theme.Colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Phones: one Filters button, with what is applied shown beside it as removable chips */}
          {!isDesktop && (
            <View style={styles.mobileFilterRow}>
              <TouchableOpacity
                style={[styles.filtersButton, activeFilters.length > 0 && styles.filtersButtonActive]}
                onPress={() => setFiltersOpen(true)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={activeFilters.length ? `Filters, ${activeFilters.length} applied` : 'Filters'}
              >
                <MaterialIcons name="tune" size={18} color={activeFilters.length ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant} />
                <Text style={[styles.filtersButtonText, activeFilters.length > 0 && styles.filtersButtonTextActive]}>
                  {activeFilters.length ? `Filters · ${activeFilters.length}` : 'Filters'}
                </Text>
              </TouchableOpacity>
              {activeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={styles.appliedChip}
                  onPress={filter.clear}
                  activeOpacity={0.75}
                  hitSlop={{ top: 6, bottom: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove filter ${filter.label}`}
                >
                  <Text style={styles.appliedChipText}>{filter.label}</Text>
                  <MaterialIcons name="close" size={16} color={theme.Colors.onPrimaryContainer} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Desktop: Status and Priority as rows of chips */}
          {isDesktop && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabelText}>Status:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={!isDesktop && chipRowBleed}
                contentContainerStyle={[{ gap: 8 }, !isDesktop && chipRowBleedContent]}
              >
                {ISSUE_STATUS_OPTIONS.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    active={statusFilter === option.value}
                    onPress={() => setStatusFilter(option.value)}
                    size="sm"
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          )}
          {isDesktop && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabelText}>Priority:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={!isDesktop && chipRowBleed}
                contentContainerStyle={[{ gap: 8 }, !isDesktop && chipRowBleedContent]}
              >
                {ISSUE_PRIORITY_OPTIONS.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={option.label}
                    active={priorityFilter === option.value}
                    onPress={() => setPriorityFilter(option.value)}
                    size="sm"
                  />
                ))}
              </ScrollView>
            </View>
          </View>
          )}

          <IssueFiltersSheet
            visible={filtersOpen}
            status={statusFilter}
            priority={priorityFilter}
            onChangeStatus={setStatusFilter}
            onChangePriority={setPriorityFilter}
            onClose={() => setFiltersOpen(false)}
          />

          {/* Content List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.filterButton} onPress={refresh}>
                <Text style={styles.filterButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : issues.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="report-off" size={48} color={theme.Colors.onSurfaceVariant} />
              {/* With filters on, say so and offer the way out rather than implying there are no issues */}
              <Text style={styles.emptyTitle}>{activeFilters.length ? 'No issues match these filters' : 'No issues logged'}</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilters.length
                  ? 'Try removing a filter to see more.'
                  : 'No reported issues or maintenance requests for this property yet.'}
              </Text>
              {activeFilters.length > 0 && (
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                  }}
                >
                  <Text style={styles.filterButtonText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {issues.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedIssueId(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.mobileCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cardUnitText}>{item.ticketNumber}</Text>
                        {Boolean(item.blockName) && (
                          <View style={styles.blockBadge}>
                            <Text style={styles.blockBadgeText}>{item.blockName}</Text>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.pill,
                          { backgroundColor: getStatusColor(item.status, item.escalationStatus).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: getStatusColor(item.status, item.escalationStatus).text },
                          ]}
                        >
                          {getStatusColor(item.status, item.escalationStatus).label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitleText}>{item.title}</Text>
                    <Text style={styles.cardDescText} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.cardFooterRow}>
                      <View
                        style={[
                          styles.pill,
                          { backgroundColor: getPriorityColor(item.priority).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: getPriorityColor(item.priority).text },
                          ]}
                        >
                          {item.priority}
                        </Text>
                      </View>
                      <Text style={styles.cardDateText}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </View>
      <IssueDetailModal
        visible={!!selectedIssueId}
        issueId={selectedIssueId}
        token={accessToken}
        onClose={() => setSelectedIssueId(null)}
        onUpdate={refresh}
      />
    </PageShell>
  );
}
