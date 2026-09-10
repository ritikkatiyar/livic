import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Platform, 
  ScrollView as RNScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useResponsive } from '@/src/hooks/useResponsive';
import { getFloorSummaries, FloorSummaryResponse } from '@/src/features/properties/api/unit.api';

// Hooks & Components
import { useFloorLayoutViewer, UnitBlock } from '../hooks/useFloorLayoutViewer';
import { TenantDetailsSidebar } from './TenantDetailsSidebar';
import { createStyles } from './FloorLayoutViewerModal.styles';
import { FloorLayoutGridCanvas } from './FloorLayoutGridCanvas';

interface FloorLayoutViewerModalProps {
  visible: boolean;
  propertyId: string;
  floorNumber: number;
  token: string;
  onClose: () => void;
}

export default function FloorLayoutViewerModal({ visible, propertyId, floorNumber, token, onClose }: FloorLayoutViewerModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();

  // Internal active floor navigation
  const [activeFloor, setActiveFloor] = useState<number>(floorNumber);
  const [is3DMode, setIs3DMode] = useState(true);

  useEffect(() => {
    setActiveFloor(floorNumber);
  }, [floorNumber]);

  // Fetch all configured floors for the property to allow seamless switching
  const { data: floorSummaries = [] } = useQuery<FloorSummaryResponse[]>({
    queryKey: ['property-floor-summaries', propertyId],
    queryFn: () => getFloorSummaries(propertyId, token),
    enabled: !!propertyId && !!token && visible,
    staleTime: 1000 * 60 * 5,
  });

  const availableFloors = React.useMemo(() => {
    if (floorSummaries && floorSummaries.length > 0) {
      return floorSummaries.map((f) => f.floorNumber).sort((a, b) => a - b);
    }
    return [1, 2, 3, 4, 5];
  }, [floorSummaries]);
  
  const {
    blocks,
    loading,
    selectedUnitId,
    setSelectedUnitId,
    tenantPhoneSearch,
    setTenantPhoneSearch,
    tenantSearchResult,
    setTenantSearchResult,
    tenantSearchLoading,
    rentAmount,
    setRentAmount,
    securityDeposit,
    setSecurityDeposit,
    tenantSearchError,
    setSuggestions,
    suggestions,
    isCreatingNewTenant,
    setIsCreatingNewTenant,
    newTenantName,
    setNewTenantName,
    newTenantEmail,
    setNewTenantEmail,
    tenantCreating,
    parentScrollEnabled,
    setParentScrollEnabled,
    resetTenantAssignmentForm,
    updateUnitDetails,
    handleSearchTenant,
    handleCreateAndSelectTenant,
    handleAssignTenant,
    handleRemoveTenant,
  } = useFloorLayoutViewer({ visible, propertyId, floorNumber: activeFloor, token });

  // Dynamic layout bounds calculation: snugly bounds the floor slab to the actual units!
  const { originX, originY, cols, rows, cellSize } = React.useMemo(() => {
    if (!blocks || blocks.length === 0) {
      return { originX: 0, originY: 0, cols: 4, rows: 3, cellSize: 96 };
    }
    const bMinX = Math.min(...blocks.map((b) => b.gridX));
    const bMinY = Math.min(...blocks.map((b) => b.gridY));
    const bMaxX = Math.max(...blocks.map((b) => b.gridX + b.gridWidth));
    const bMaxY = Math.max(...blocks.map((b) => b.gridY + b.gridHeight));

    const padMinX = Math.max(0, bMinX - 1);
    const padMinY = Math.max(0, bMinY - 1);
    const padMaxX = bMaxX + 1;
    const padMaxY = bMaxY + 1;

    const spanX = Math.max(padMaxX - padMinX, 3);
    const spanY = Math.max(padMaxY - padMinY, 3);

    const targetPlateWidth = isDesktop ? 440 : 320;
    const computedCellSize = Math.max(72, Math.min(105, Math.floor(targetPlateWidth / spanX)));

    return {
      originX: padMinX,
      originY: padMinY,
      cols: spanX,
      rows: spanY,
      cellSize: computedCellSize,
    };
  }, [blocks, isDesktop]);

  const scale = useSharedValue(1.0);
  const savedScale = useSharedValue(1.0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const desktopGridWrapperRef = useRef<any>(null);
  const sheetScrollRef = useRef<RNScrollView | null>(null);

  // Pinch / Zoom Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, 0.4), 2.5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: withTiming(is3DMode ? '60deg' : '0deg', { duration: 350 }) },
      { rotateZ: withTiming(is3DMode ? '-45deg' : '0deg', { duration: 350 }) },
      { scale: scale.value }
    ],
  }));

  const handleZoomIn = () => {
    scale.value = withTiming(Math.min(scale.value * 1.25, 2.5), { duration: 200 });
    savedScale.value = Math.min(savedScale.value * 1.25, 2.5);
  };
  const handleZoomOut = () => {
    scale.value = withTiming(Math.max(scale.value * 0.8, 0.4), { duration: 200 });
    savedScale.value = Math.max(savedScale.value * 0.8, 0.4);
  };
  const handleResetCamera = () => {
    scale.value = withTiming(1.0, { duration: 250 });
    savedScale.value = 1.0;
    translateX.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(0, { duration: 250 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const zoomIntensity = 0.05;
      const delta = -e.deltaY;
      const factor = delta > 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
      const newScale = scale.value * factor;
      scale.value = Math.min(Math.max(newScale, 0.4), 2.5);
      savedScale.value = scale.value;
    };

    const desktopElement = desktopGridWrapperRef.current;
    if (desktopElement) {
      desktopElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    return () => {
      if (desktopElement) {
        desktopElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [visible, scale, savedScale]);

  const getBlockColorStyles = (b: UnitBlock) => {
    const activeCount = b.activeLeases ? b.activeLeases.length : 0;
    const capacity = b.capacity || 1;

    if (activeCount === 0) {
      return {
        backgroundColor: theme.Colors.primary,
        borderColor: theme.Colors.primary,
        textColor: theme.Colors.onPrimary,
        accentColor: theme.Colors.primaryContainer,
      };
    } else if (activeCount < capacity) {
      return {
        backgroundColor: theme.Colors.tertiary,
        borderColor: theme.Colors.tertiary,
        textColor: theme.Colors.onTertiary,
        accentColor: theme.Colors.tertiaryContainer,
      };
    } else {
      return {
        backgroundColor: theme.Colors.error,
        borderColor: theme.Colors.error,
        textColor: theme.Colors.onError,
        accentColor: theme.Colors.errorContainer,
      };
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedUnitId);

  const renderGrid = () => (
    <FloorLayoutGridCanvas
      blocks={blocks}
      selectedUnitId={selectedUnitId}
      setSelectedUnitId={setSelectedUnitId}
      resetTenantAssignmentForm={resetTenantAssignmentForm}
      getBlockColorStyles={getBlockColorStyles}
      styles={styles}
      theme={theme}
      originX={originX}
      originY={originY}
      cols={cols}
      rows={rows}
      cellSize={cellSize}
      is3DMode={is3DMode}
    />
  );

  const renderDetailsSidebar = () => {
    if (!selectedBlock) return null;
    return (
      <TenantDetailsSidebar
        selectedBlock={selectedBlock}
        floorNumber={activeFloor}
        onClose={() => {
          setSelectedUnitId(null);
          resetTenantAssignmentForm();
        }}
        sheetScrollRef={sheetScrollRef as any}
        isCreatingNewTenant={isCreatingNewTenant}
        setIsCreatingNewTenant={setIsCreatingNewTenant}
        tenantPhoneSearch={tenantPhoneSearch}
        setTenantPhoneSearch={setTenantPhoneSearch}
        newTenantName={newTenantName}
        setNewTenantName={setNewTenantName}
        newTenantEmail={newTenantEmail}
        setNewTenantEmail={setNewTenantEmail}
        tenantSearchError={tenantSearchError}
        tenantCreating={tenantCreating}
        parentScrollEnabled={parentScrollEnabled}
        setParentScrollEnabled={setParentScrollEnabled}
        handleCreateAndSelectTenant={handleCreateAndSelectTenant}
        handleSearchTenant={handleSearchTenant}
        tenantSearchLoading={tenantSearchLoading}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        setTenantSearchResult={setTenantSearchResult}
        tenantSearchResult={tenantSearchResult}
        rentAmount={rentAmount}
        setRentAmount={setRentAmount}
        securityDeposit={securityDeposit}
        setSecurityDeposit={setSecurityDeposit}
        handleAssignTenant={handleAssignTenant}
        tenantAssigning={tenantCreating}
        handleRemoveTenant={handleRemoveTenant}
        updateUnitDetails={updateUnitDetails}
        isDesktop={isDesktop}
      />
    );
  };

  // Creative Floor Directory & Intelligence Card (displayed when no unit is selected)
  const renderFloorDirectory = () => {
    const totalUnits = blocks.length;
    const occupiedCount = blocks.filter((b) => b.status === 'OCCUPIED').length;
    const totalRent = blocks.reduce((acc, b) => acc + (Number(b.rent) || 0), 0);
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

    return (
      <View style={styles.directoryContainer}>
        {/* Floor Overview Card */}
        <View style={styles.directoryHeroCard}>
          <View style={styles.directoryHeroHeader}>
            <View>
              <Text style={styles.directoryKicker}>FLOOR INTELLIGENCE</Text>
              <Text style={styles.directoryTitle}>Floor {activeFloor} Overview</Text>
            </View>
            <View style={[styles.occupancyBadge, occupancyRate === 100 && styles.occupancyBadgeFull]}>
              <Text style={[styles.occupancyBadgeText, occupancyRate === 100 && styles.occupancyBadgeTextFull]}>
                {occupancyRate === 100 ? 'Fully Leased' : `${occupancyRate}% Occupied`}
              </Text>
            </View>
          </View>

          <View style={styles.directoryMetricsRow}>
            <View style={styles.directoryMetricChip}>
              <Text style={styles.directoryMetricLabel}>Units</Text>
              <Text style={styles.directoryMetricValue}>{totalUnits}</Text>
            </View>
            <View style={styles.directoryMetricChip}>
              <Text style={styles.directoryMetricLabel}>Occupancy</Text>
              <Text style={styles.directoryMetricValue}>
                {occupiedCount}/{totalUnits}
              </Text>
            </View>
            <View style={styles.directoryMetricChip}>
              <Text style={styles.directoryMetricLabel}>Monthly Rent</Text>
              <Text style={styles.directoryMetricValue}>₹{totalRent.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Unit Directory Roster */}
        <View style={styles.unitListWrapper}>
          <Text style={styles.unitListTitle}>Floor Units & Tenants ({totalUnits})</Text>
          <RNScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {blocks.map((block) => {
              const isOcc = block.status === 'OCCUPIED';
              const tenant = block.tenants && block.tenants[0] ? block.tenants[0] : null;
              return (
                <TouchableOpacity
                  key={block.id}
                  activeOpacity={0.85}
                  style={styles.unitListItemCard}
                  onPress={() => {
                    setSelectedUnitId(block.id);
                    resetTenantAssignmentForm();
                  }}
                >
                  <View style={styles.unitListItemLeft}>
                    <View
                      style={[
                        styles.unitBadgeSmall,
                        { backgroundColor: isOcc ? theme.Colors.error : theme.Colors.primary },
                      ]}
                    >
                      <Text style={styles.unitBadgeSmallText}>{block.unitNumber}</Text>
                    </View>
                    <View style={styles.unitListItemInfo}>
                      <Text numberOfLines={1} style={styles.unitListItemTenant}>
                        {isOcc ? tenant || 'Occupied' : 'Vacant Unit'}
                      </Text>
                      <Text style={styles.unitListItemSub}>
                        {block.rent ? `₹${Number(block.rent).toLocaleString()}/mo` : 'No rent configured'} • {block.type || 'Single'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.unitInspectAction}>
                    <Text style={styles.unitInspectText}>Inspect</Text>
                    <MaterialIcons name="chevron-right" size={16} color={theme.Colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </RNScrollView>
        </View>
      </View>
    );
  };

  if (isDesktop) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <BlurView intensity={35} tint="dark" style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentDesktop]}>
            <LinearGradient
              colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopShell}
            >
              <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.desktopMain}>
                  {/* Header: Title + Floor Switcher Tabs + Close Button */}
                  <View style={styles.desktopHeaderRow}>
                    <View style={styles.largeTitleContainer}>
                      <View style={styles.titleWithBadgeRow}>
                        <Text style={styles.titleLineDesktop}>Floor {activeFloor} Layout & Tenants</Text>
                        <View style={styles.unitCountBadge}>
                          <Text style={styles.unitCountBadgeText}>
                            {blocks.length} Units
                          </Text>
                        </View>
                      </View>

                      {/* Floor Switcher Tabs Bar */}
                      <View style={styles.floorTabsScroll}>
                        <View style={styles.floorTabsRow}>
                          {availableFloors.map((fNum) => {
                            const isActive = fNum === activeFloor;
                            return (
                              <TouchableOpacity
                                key={`tab-floor-${fNum}`}
                                activeOpacity={0.8}
                                style={[styles.floorTabPill, isActive && styles.floorTabPillActive]}
                                onPress={() => {
                                  setActiveFloor(fNum);
                                  setSelectedUnitId(null);
                                  resetTenantAssignmentForm();
                                }}
                              >
                                <Text style={[styles.floorTabText, isActive && styles.floorTabTextActive]}>
                                  Floor {fNum}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.backButtonDesktop} 
                      onPress={onClose}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.backButtonTextDesktop}>Close View</Text>
                      <MaterialIcons name="close" size={18} color={theme.Colors.onSurface} />
                    </TouchableOpacity>
                  </View>

                  {/* Main Two-Column Layout */}
                  <View style={styles.desktopMainContent}>
                    {/* Left Canvas: Architectural 3D/2D Blueprint */}
                    <View style={styles.desktopCanvasColumn}>
                      <GestureDetector gesture={composedGesture}>
                        <View ref={desktopGridWrapperRef} style={styles.desktopGridWrapper}>
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="large" color={theme.Colors.primary} />
                              <Text style={styles.loadingText}>Loading Floor {activeFloor}...</Text>
                            </View>
                          ) : (
                            <View style={styles.canvasContainer}>
                              {/* Canvas Legend Overlay at Top-Right */}
                              <View style={styles.canvasLegendOverlay}>
                                <View style={styles.legendItem}>
                                  <View style={[styles.legendDot, { backgroundColor: theme.Colors.primary }]} />
                                  <Text style={styles.legendText}>Vacant</Text>
                                </View>
                                <View style={styles.legendItem}>
                                  <View style={[styles.legendDot, { backgroundColor: theme.Colors.tertiary }]} />
                                  <Text style={styles.legendText}>Partial</Text>
                                </View>
                                <View style={styles.legendItem}>
                                  <View style={[styles.legendDot, { backgroundColor: theme.Colors.error }]} />
                                  <Text style={styles.legendText}>Occupied</Text>
                                </View>
                              </View>

                              {/* Floating Canvas Controls at Bottom-Left */}
                              <View style={styles.canvasFloatingToolbar}>
                                <TouchableOpacity
                                  style={[styles.toolbarButton, !is3DMode && styles.toolbarButtonActive]}
                                  onPress={() => setIs3DMode(!is3DMode)}
                                  activeOpacity={0.8}
                                >
                                  <MaterialIcons
                                    name={is3DMode ? 'view-in-ar' : 'architecture'}
                                    size={16}
                                    color={!is3DMode ? theme.Colors.onPrimary : theme.Colors.onSurface}
                                  />
                                  <Text style={[styles.toolbarButtonText, !is3DMode && styles.toolbarButtonTextActive]}>
                                    {is3DMode ? '3D Iso' : '2D Plan'}
                                  </Text>
                                </TouchableOpacity>

                                <View style={styles.toolbarDivider} />

                                <TouchableOpacity style={styles.toolbarButton} onPress={handleZoomIn} activeOpacity={0.8}>
                                  <MaterialIcons name="zoom-in" size={18} color={theme.Colors.onSurface} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton} onPress={handleZoomOut} activeOpacity={0.8}>
                                  <MaterialIcons name="zoom-out" size={18} color={theme.Colors.onSurface} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.toolbarButton} onPress={handleResetCamera} activeOpacity={0.8}>
                                  <MaterialIcons name="restart-alt" size={18} color={theme.Colors.onSurface} />
                                </TouchableOpacity>
                              </View>

                              {/* Dynamic Architectural Floor Slab */}
                              <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                                <View
                                  style={[
                                    styles.gridContainer,
                                    {
                                      width: cols * cellSize,
                                      height: rows * cellSize,
                                    },
                                  ]}
                                >
                                  {renderGrid()}
                                </View>
                              </Animated.View>
                            </View>
                          )}
                        </View>
                      </GestureDetector>
                    </View>

                    {/* Right Column: Tenant Management OR Floor Directory */}
                    <View style={styles.desktopSidebarColumn}>
                      <View style={{ flex: 1 }}>
                        {selectedBlock ? renderDetailsSidebar() : renderFloorDirectory()}
                      </View>
                    </View>
                  </View>
                </View>
              </GestureHandlerRootView>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    );
  }

  // Mobile Version
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <LinearGradient
            colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                <View style={styles.mobilePopupHeader}>
                  <View style={styles.mobileTitleBlock}>
                    <Text style={styles.mobileKicker}>FLOOR BLUEPRINT</Text>
                    <Text style={styles.mobileTitleText}>Floor {activeFloor} Layout & Tenants</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.mobileCloseBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.Colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.floorTabsScroll}>
                  <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.floorTabsRow}>
                    {availableFloors.map((fNum) => {
                      const isActive = fNum === activeFloor;
                      return (
                        <TouchableOpacity
                          key={`m-tab-floor-${fNum}`}
                          activeOpacity={0.8}
                          style={[styles.floorTabPill, isActive && styles.floorTabPillActive]}
                          onPress={() => {
                            setActiveFloor(fNum);
                            setSelectedUnitId(null);
                            resetTenantAssignmentForm();
                          }}
                        >
                          <Text style={[styles.floorTabText, isActive && styles.floorTabTextActive]}>
                            Floor {fNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </RNScrollView>
                </View>

                <View style={styles.gridWrapper}>
                  <GestureDetector gesture={composedGesture}>
                    <View style={styles.canvasContainer}>
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={theme.Colors.primary} />
                          <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                      ) : (
                        <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                          <View
                            style={[
                              styles.gridContainer,
                              {
                                width: cols * cellSize,
                                height: rows * cellSize,
                              },
                            ]}
                          >
                            {renderGrid()}
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  </GestureDetector>
                </View>

                {selectedBlock && (
                  <View style={styles.mobileBottomActionContainer}>
                    {renderDetailsSidebar()}
                  </View>
                )}
              </View>
            </GestureHandlerRootView>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}
