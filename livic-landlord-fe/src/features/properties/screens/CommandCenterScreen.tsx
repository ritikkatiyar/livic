import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import type { PropertyResponse } from '@/src/types/property';
import FloorLayoutViewerModal from '@/src/features/properties/components/FloorLayoutViewerModal';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { SkeletonCardGrid } from '@/src/components/common/feedback/Skeleton';
import { StatCard } from '@/src/components/common/display/StatCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useResponsive } from '@/src/hooks/useResponsive';

import { getAnalyticsSummary, getPortfolioOccupancy } from '@/src/features/analytics/api/analytics.api';
import { useIssues } from '@/src/features/issues/hooks/useIssues';

// Phase 4 modular hook & component imports
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useCommandCenter } from '@/src/features/properties/hooks/useCommandCenter';
import { PropertyCard } from '@/src/features/properties/components/PropertyCard';
import { BroadcastComposerModal } from '@/src/features/properties/components/BroadcastComposerModal';
import { CommandCenterEmptyState } from '@/src/features/properties/components/CommandCenterEmptyState';
import { useAdminTutorial } from '@/src/features/onboarding/context/AdminTutorialContext';
import { AdminTutorialBanner } from '@/src/features/onboarding/components/AdminTutorialBanner';
import { AdminTutorialModal } from '@/src/features/onboarding/components/AdminTutorialModal';
import { createStyles } from './CommandCenterScreen.styles';



interface CommandCenterScreenProps {
  onNavigateToCreateProperty: () => void;
  onLogout: () => void;
}

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }: CommandCenterScreenProps) {
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const { accessToken, context } = useAuth();
  const { searchQuery, setSearchQuery } = useGlobalPropertySelection();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const { properties, isLoading, deleteProperty, togglePropertyActive } = useProperties(debouncedSearchQuery);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [debouncedSearchQuery]);

  const handleEndReached = () => {
    if (visibleCount < properties.length) {
      setVisibleCount(prev => Math.min(properties.length, prev + 6));
    }
  };

  const visibleProperties = properties.slice(0, visibleCount);
  const hasMore = visibleCount < properties.length;

  const { showToast } = useToast();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Real analytics states
  const [occupancyRate, setOccupancyRate] = useState<string>('0.0%');
  const [revenueText, setRevenueText] = useState<string>('₹ 0');
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Issues hook for alerts count
  const { metrics: issueMetrics } = useIssues(accessToken);

  const { autoDetectProgress } = useAdminTutorial();

  const isAdminRole = context?.globalRole === 'ADMIN' || context?.globalRole === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isLoading && isAdminRole) {
      autoDetectProgress({ propertyCount: properties.length });
    }
  }, [properties.length, isLoading, autoDetectProgress, isAdminRole]);

  useEffect(() => {
    async function loadMetrics() {
      if (!accessToken) return;
      try {
        setMetricsLoading(true);
        const [occData, sumData] = await Promise.all([
          getPortfolioOccupancy(accessToken),
          getAnalyticsSummary(accessToken),
        ]);

        // Calculate aggregate occupancy
        let totalUnits = 0;
        let totalOccupied = 0;
        occData.forEach(p => {
          totalUnits += p.totalUnits || 0;
          totalOccupied += p.occupiedUnits || 0;
        });
        const aggregateRate = totalUnits > 0 ? Math.min(100, Math.max(0, (totalOccupied / totalUnits) * 100)) : 0;
        setOccupancyRate(`${aggregateRate.toFixed(1)}%`);

        // Format collected revenue
        const collected = sumData.collectedRevenue || 0;
        if (collected >= 10000000) {
          setRevenueText(`₹ ${(collected / 10000000).toFixed(2)}Cr`);
        } else if (collected >= 100000) {
          setRevenueText(`₹ ${(collected / 100000).toFixed(2)}L`);
        } else {
          setRevenueText(`₹ ${collected.toLocaleString()}`);
        }
      } catch (err) {
        console.error('Failed to load CommandCenter stats', err);
      } finally {
        setMetricsLoading(false);
      }
    }
    loadMetrics();
  }, [accessToken]);

  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const {
    resetTriggers,
    triggerReset,
    layoutViewerPropertyId,
    layoutViewerFloorNumber,
    setLayoutViewerPropertyId,
    setLayoutViewerFloorNumber,
    handleFloorClick,
    selectedPropertyForBroadcast,
    setSelectedPropertyForBroadcast,
    broadcastTitle,
    setBroadcastTitle,
    broadcastContent,
    setBroadcastContent,
    broadcastCategory,
    setBroadcastCategory,
    broadcastSeverity,
    setBroadcastSeverity,
    broadcastTargetType,
    setBroadcastTargetType,
    broadcastTargetValue,
    setBroadcastTargetValue,
    sendingBroadcast,
    handleSendBroadcast,
    handleDeleteProperty,
  } = useCommandCenter({
    accessToken,
    showToast,
    deleteProperty,
    togglePropertyActive
  });


  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });


  const totalVacantUnits = React.useMemo(() => {
    return properties.reduce((sum, p) => sum + Math.max(0, (p.totalUnits || 0) - (p.occupiedUnits || 0)), 0);
  }, [properties]);
  const totalAlerts = issueMetrics.open + issueMetrics.escalated;

  const renderStatCard = (label: string, value: string, icon: keyof typeof MaterialIcons.glyphMap, color = theme.Colors.primary, valueColor?: string) => (
    <StatCard
      label={label}
      value={value}
      loading={metricsLoading}
      iconName={icon}
      iconColor={color}
      valueColor={valueColor || color}
      style={isDesktop ? { flex: 1 } : { flexBasis: '47%', minWidth: '47%' }}
    />
  );

  const renderPropertyCard = (item: PropertyResponse) => (
    <PropertyCard
      item={item}
      isDesktop={isDesktop}
      accessToken={accessToken}
      resetRotationTrigger={resetTriggers[item.id] || 0}
      handleFloorClick={handleFloorClick}
      triggerReset={triggerReset}
      handleDeleteProperty={handleDeleteProperty}
      togglePropertyActive={togglePropertyActive}
      showToast={showToast}
      setSelectedPropertyForBroadcast={setSelectedPropertyForBroadcast}
    />
  );

  const ListHeader = () => (
    <Animated.View style={[styles.titleContainer, !isDesktop && { opacity: largeTitleOpacity }]}>
      <AdminTutorialBanner />
      {isDesktop ? (
        <>
          <View style={styles.desktopTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={styles.mainTitle}>My Properties</Text>
              {properties.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{properties.length}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* In-page Desktop Search */}
              <View style={styles.desktopSearchBox}>
                <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.desktopSearchInput}
                  placeholder="Filter properties by name or location..."
                  placeholderTextColor={theme.Colors.onSurfaceVariant}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {properties.length > 0 && (
                <ActionButton
                  label="Add Property"
                  icon="add"
                  iconPosition="left"
                  variant="primary"
                  size="md"
                  onPress={onNavigateToCreateProperty}
                />
              )}
            </View>
          </View>
          {properties.length > 0 && (
            <View style={styles.desktopStatusStrip}>
              <View style={styles.desktopStatusChip}>
                <MaterialIcons name="apartment" size={16} color={theme.Colors.primary} />
                <Text style={styles.desktopStatusChipText}>{properties.length} Properties</Text>
              </View>
              <View style={styles.desktopStatusChip}>
                <MaterialIcons name="meeting-room" size={16} color={totalVacantUnits > 0 ? theme.Colors.secondary : theme.Colors.primary} />
                <Text style={styles.desktopStatusChipText}>{totalVacantUnits} Units Vacant</Text>
              </View>
              <View style={styles.desktopStatusChip}>
                <MaterialIcons name="warning-amber" size={16} color={totalAlerts > 0 ? theme.Colors.error : theme.Colors.onSurfaceVariant} />
                <Text style={styles.desktopStatusChipText}>{totalAlerts} Maintenance Alerts</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        /* Mobile Layout: Clean, Focused, No Redundant Stat Boxes */
        <View>
          <View style={styles.mobileTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.mainTitle}>My Properties</Text>
              {properties.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{properties.length}</Text>
                </View>
              )}
            </View>
            {properties.length > 0 && (
              <TouchableOpacity
                style={styles.mobileAddBtn}
                onPress={onNavigateToCreateProperty}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Add Property"
                accessibilityRole="button"
              >
                <MaterialIcons name="add" size={22} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Box directly on top fold */}
          <View style={styles.mobileSearchRow}>
            <View style={styles.mobileSearchBox}>
              <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search properties or locations..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={18} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const ListEmptyComponent = () => {
    // Don't show the empty state while the initial fetch is in progress.
    if (isLoading) return null;
    return <CommandCenterEmptyState onNavigateToCreateProperty={onNavigateToCreateProperty} />;
  };

  const ListFooter = () => (
    properties.length > 0 && !isDesktop ? (
      <TouchableOpacity
        style={styles.mobileAddFooterBtn}
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-circle-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.mobileAddFooterText}>Add Another Property</Text>
      </TouchableOpacity>
    ) : null
  );

  return (
    <>
      <PageShell scrollable edges={isDesktop ? ['top'] : []} onEndReached={handleEndReached}>
        <ListHeader />
        {isLoading ? (
          <SkeletonCardGrid count={isDesktop ? 2 : 1} isDesktop={isDesktop} />
        ) : properties.length === 0 ? (
          <ListEmptyComponent />
        ) : (
          <>
            <View style={styles.propertyGrid}>
              {visibleProperties.map((property) => (
                <View key={property.id} style={styles.propertyGridItem}>
                  {renderPropertyCard(property)}
                </View>
              ))}
            </View>
            <ListFooter />
            {hasMore && (
              <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={theme.Colors.primary} />
                <Text style={[{ color: theme.Colors.onSurfaceVariant, marginTop: 6, fontWeight: '700', letterSpacing: 0.5 }, theme.Typography.labelSmall]}>
                  Loading more properties...
                </Text>
              </View>
            )}
          </>
        )}
      </PageShell>

      {/* Broadcast Notice Composer Modal */}
      <BroadcastComposerModal
        visible={!!selectedPropertyForBroadcast}
        selectedPropertyForBroadcast={selectedPropertyForBroadcast}
        broadcastTitle={broadcastTitle}
        setBroadcastTitle={setBroadcastTitle}
        broadcastContent={broadcastContent}
        setBroadcastContent={setBroadcastContent}
        broadcastCategory={broadcastCategory}
        setBroadcastCategory={setBroadcastCategory}
        broadcastSeverity={broadcastSeverity}
        setBroadcastSeverity={setBroadcastSeverity}
        broadcastTargetType={broadcastTargetType}
        setBroadcastTargetType={setBroadcastTargetType}
        broadcastTargetValue={broadcastTargetValue}
        setBroadcastTargetValue={setBroadcastTargetValue}
        sendingBroadcast={sendingBroadcast}
        handleSendBroadcast={handleSendBroadcast}
        onClose={() => setSelectedPropertyForBroadcast(null)}
      />

      {/* Floor Layout Viewer Modal */}
      {layoutViewerPropertyId !== null && layoutViewerFloorNumber !== null && (
        <FloorLayoutViewerModal
          visible={true}
          propertyId={layoutViewerPropertyId}
          floorNumber={layoutViewerFloorNumber}
          token={accessToken || ''}
          onClose={() => {
            setLayoutViewerPropertyId(null);
            setLayoutViewerFloorNumber(null);
          }}
        />
      )}

      {/* Admin Setup Checklist Tutorial Modal */}
      <AdminTutorialModal />
    </>
  );
}

