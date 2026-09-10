import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Animated, PanResponder, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAllFloorsLayout, UnitResponse } from '@/src/features/properties/api/unit.api';
import { logger } from '@/src/utils/logger';

interface Building3DViewProps {
  propertyId: string;
  token: string;
  onFloorClick?: (floorNum: number) => void;
  resetRotationTrigger?: number;
  maxContainerHeight?: number;
}

function Building3DSkeleton({ isDark, theme }: { isDark: boolean; theme: any }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const tileBorderColor = isDark ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 104, 117, 0.3)';
  const tileBgColor = isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 104, 117, 0.08)';

  return (
    <Animated.View style={[styles3DSkeleton.wrapper, { opacity: pulseAnim }]}>
      {[0, 1, 2].map((idx) => (
        <View
          key={idx}
          style={[
            styles3DSkeleton.plate,
            {
              borderColor: tileBorderColor,
              backgroundColor: tileBgColor,
              transform: [
                { translateY: -idx * 24 + 14 },
                { rotateX: '60deg' },
                { rotateZ: '-45deg' },
              ],
            },
          ]}
        >
          <View style={styles3DSkeleton.gridRow}>
            <View style={[styles3DSkeleton.cell, { flex: 1, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 104, 117, 0.2)' }]} />
            <View style={[styles3DSkeleton.cell, { flex: 1.2, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 104, 117, 0.15)' }]} />
            <View style={[styles3DSkeleton.cell, { flex: 0.8, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.35)' : 'rgba(0, 104, 117, 0.25)' }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles3DSkeleton = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plate: {
    position: 'absolute',
    width: 120,
    height: 75,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 5,
    backfaceVisibility: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  cell: {
    borderRadius: 3,
    height: '100%',
  },
});

export default function Building3DView({ propertyId, token, onFloorClick, resetRotationTrigger, maxContainerHeight = 260 }: Building3DViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { data: units = [], isLoading: loading } = useQuery<UnitResponse[]>({
    queryKey: ['property-layouts', propertyId],
    queryFn: () => getAllFloorsLayout(propertyId, token),
    enabled: !!propertyId && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const containerRef = useRef<View>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 280,
    height: maxContainerHeight,
  });

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (Math.abs(containerDimensions.width - width) > 5 || Math.abs(containerDimensions.height - height) > 5) {
        setContainerDimensions({ width, height });
      }
    }
  };

  const rotateZ = useRef(new Animated.Value(-45)).current;
  const rotateX = useRef(new Animated.Value(60)).current;
  const lastRotation = useRef(-45);
  const lastRotationX = useRef(60);

  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const floorElevations = useRef<Record<number, Animated.Value>>({}).current;
  const isDragging = useRef(false);

  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web' || !onFloorClick) return;
    if (isDragging.current) {
      if (hoveredFloor !== null) setHoveredFloor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const state = stateRef.current;
    if (!state.floorNumbers.length) return;

    const clickY = e.clientY - rect.top;
    const itemHeight = rect.height / state.floorNumbers.length;
    const idx = Math.floor((rect.height - clickY) / itemHeight);
    const targetFloor = state.floorNumbers[Math.max(0, Math.min(idx, state.floorNumbers.length - 1))];
    if (hoveredFloor !== targetFloor) {
      setHoveredFloor(targetFloor);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && hoveredFloor !== null) {
      setHoveredFloor(null);
    }
  };

  // 1. Group units by floor
  const floors = units.reduce((acc, unit) => {
    if (!acc[unit.floor]) acc[unit.floor] = [];
    acc[unit.floor].push(unit);
    return acc;
  }, {} as Record<number, UnitResponse[]>);

  const floorNumbers = Object.keys(floors).map(Number).sort((a, b) => a - b);
  const numFloors = floorNumbers.length > 0 ? floorNumbers.length : 1;

  // 2. Compute bounds per floor so units on every floor align in a clean, vertical stack
  let maxSpanX = 1;
  let maxSpanY = 1;
  const floorBounds: Record<number, { minX: number; minY: number; spanX: number; spanY: number }> = {};

  floorNumbers.forEach(f => {
    const fUnits = floors[f];
    let fMinX = 999, fMaxX = 0, fMinY = 999, fMaxY = 0;
    fUnits.forEach(u => {
      if (u.gridX < fMinX) fMinX = u.gridX;
      if (u.gridX + u.gridWidth - 1 > fMaxX) fMaxX = u.gridX + u.gridWidth - 1;
      if (u.gridY < fMinY) fMinY = u.gridY;
      if (u.gridY + u.gridHeight - 1 > fMaxY) fMaxY = u.gridY + u.gridHeight - 1;
    });
    const spanX = Math.max(fMaxX - fMinX + 1, 1);
    const spanY = Math.max(fMaxY - fMinY + 1, 1);
    floorBounds[f] = { minX: fMinX, minY: fMinY, spanX, spanY };
    if (spanX > maxSpanX) maxSpanX = spanX;
    if (spanY > maxSpanY) maxSpanY = spanY;
  });

  const gridW = Math.max(maxSpanX, 1);
  const gridH = Math.max(maxSpanY, 1);

  floorNumbers.forEach(floorNum => {
    if (!floorElevations[floorNum]) {
      floorElevations[floorNum] = new Animated.Value(0);
    }
  });

  const availableWidth = containerDimensions ? containerDimensions.width : 280;
  const availableHeight = containerDimensions ? containerDimensions.height : maxContainerHeight;

  // Floor vertical spacing (independent of horizontal cell size to prevent tiny crushed floors on multi-story buildings)
  const dynamicFloorHeight = Math.max(
    18,
    Math.min(28, Math.floor((availableHeight * 0.46) / Math.max(numFloors - 1, 1)))
  );
  const minFloor = floorNumbers.length > 0 ? floorNumbers[0] : 1;
  const stackHeightOffset = (floorNumbers.length > 0 ? floorNumbers.length - 1 : 0) * dynamicFloorHeight;

  // Max width in 45-degree isometric projection: (gridW + gridH) * dynamicCellSize * 0.7071
  const rawIsoWidth = (gridW + gridH) * 0.7071;
  const maxCellSizeWidth = Math.floor((availableWidth * 0.78) / (rawIsoWidth || 1));

  // Max height in 60-degree tilt: single plate projected height = (gridW + gridH) * dynamicCellSize * 0.36
  const remainingHeightForPlate = Math.max(availableHeight * 0.88 - stackHeightOffset, 50);
  const maxCellSizeHeight = Math.floor(remainingHeightForPlate / (((gridW + gridH) * 0.36) || 1));

  let dynamicCellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);

  // Generous clamp: allows small floor layouts (e.g. 2x1, 2x2, 3x2) to scale up beautifully up to 80px per unit
  if (dynamicCellSize > 76) dynamicCellSize = 76;
  if (dynamicCellSize < 12) dynamicCellSize = 12;

  const buildingWidth = gridW * dynamicCellSize;
  const buildingHeight = gridH * dynamicCellSize;

  const visualIsoHeight = (gridW + gridH) * dynamicCellSize * 0.4;
  const containerHeight = visualIsoHeight + stackHeightOffset;

  const stateRef = useRef({
    floorNumbers,
    minFloor,
    dynamicFloorHeight,
    stackHeightOffset,
    buildingHeight,
    visualIsoHeight,
    containerHeight,
    onFloorClick,
    buildingWidth,
  });

  stateRef.current = {
    floorNumbers,
    minFloor,
    dynamicFloorHeight,
    stackHeightOffset,
    buildingHeight,
    visualIsoHeight,
    containerHeight,
    onFloorClick,
    buildingWidth,
  };

  useEffect(() => {
    const animations = Object.keys(floorElevations).map((fKey) => {
      const fNum = Number(fKey);
      const toValue = fNum === hoveredFloor ? -14 : 0;
      return Animated.spring(floorElevations[fNum], {
        toValue,
        useNativeDriver: false,
        friction: 6,
        tension: 50,
      });
    });
    Animated.parallel(animations).start();
  }, [hoveredFloor]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        isDragging.current = true;
        rotateZ.stopAnimation();
        rotateX.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        const newRotZ = lastRotation.current - gestureState.dx * 0.5;
        let newRotX = lastRotationX.current - gestureState.dy * 0.5;
        if (newRotX < 20) newRotX = 20;
        if (newRotX > 80) newRotX = 80;

        rotateZ.setValue(newRotZ);
        rotateX.setValue(newRotX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        setHoveredFloor(null);

        lastRotation.current -= gestureState.dx * 0.5;
        let newRotX = lastRotationX.current - gestureState.dy * 0.5;
        if (newRotX < 20) newRotX = 20;
        if (newRotX > 80) newRotX = 80;
        lastRotationX.current = newRotX;

        // Tap handling for floor click
        if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
          const state = stateRef.current;
          if (state.onFloorClick && state.floorNumbers.length > 0) {
            const targetFloor = hoveredFloor ?? state.floorNumbers[0];
            logger.debug('[Building3DView] Tap detected on floor:', targetFloor);
            state.onFloorClick(targetFloor);
          }
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        setHoveredFloor(null);
      },
    })
  ).current;

  const spin = rotateZ.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const tilt = rotateX.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  const handleResetRotation = () => {
    lastRotation.current = -45;
    lastRotationX.current = 60;
    Animated.parallel([
      Animated.timing(rotateZ, {
        toValue: -45,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(rotateX, {
        toValue: 60,
        duration: 400,
        useNativeDriver: false,
      })
    ]).start();
  };

  useEffect(() => {
    if (resetRotationTrigger !== undefined && resetRotationTrigger > 0) {
      handleResetRotation();
    }
  }, [resetRotationTrigger]);

  const webMouseProps = Platform.OS === 'web' ? {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  } : {};

  return (
    <View 
      onLayout={handleLayout}
      style={{ position: 'relative', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
      {...(webMouseProps as any)}
    >
      {loading ? (
        <Building3DSkeleton isDark={isDark} theme={theme} />
      ) : !units || units.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Layout</Text>
        </View>
      ) : (
        <>
          {/* Glassmorphic Occupancy Status Legend Badge */}
          <View style={styles.legendContainer} pointerEvents="none">
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

          <View 
            ref={containerRef}
            style={[
              styles.container, 
              { 
                width: buildingWidth + 40,
                height: containerHeight
              }
            ]}
            {...panResponder.panHandlers}
          >
            {floorNumbers.map((floorNum) => {
              const elevationAnim = floorElevations[floorNum] || new Animated.Value(0);
              const baseTranslateY = -(floorNum - minFloor) * dynamicFloorHeight + stackHeightOffset / 2 + 10;
              const isHovered = floorNum === hoveredFloor;
              const b = floorBounds[floorNum] || { minX: 0, minY: 0, spanX: gridW, spanY: gridH };
              const offsetX = Math.floor((gridW - b.spanX) / 2) * dynamicCellSize;
              const offsetY = Math.floor((gridH - b.spanY) / 2) * dynamicCellSize;
              
              return (
                <Animated.View
                  key={`floor-${floorNum}`}
                  style={{
                    position: 'absolute',
                    zIndex: floorNum,
                    transform: [
                      { translateY: Animated.add(baseTranslateY, elevationAnim) },
                    ],
                  }}
                >
                  {/* 3D Slab Thickness Extrusion (layer stacking) */}
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Animated.View
                      key={`floor-slab-extrusion-${floorNum}-${idx}`}
                      style={[
                        styles.isometricWrapper,
                        styles.slabExtrusion,
                        {
                          position: 'absolute',
                          zIndex: -1 - idx,
                          width: buildingWidth,
                          height: buildingHeight,
                          transform: [{ rotateX: tilt }, { rotateZ: spin }],
                          top: (idx + 1) * 1.5,
                          opacity: 0.9 - idx * 0.15,
                          backgroundColor: isHovered ? (isDark ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 104, 117, 0.35)') : (isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 104, 117, 0.15)'),
                          borderColor: isHovered ? theme.Colors.primary : theme.Colors.glassStroke,
                        }
                      ]}
                    />
                  ))}

                  {/* Main Floor Plate & Units */}
                  <Animated.View 
                    style={[
                      styles.isometricWrapper, 
                      { 
                        width: buildingWidth,
                        height: buildingHeight,
                        transform: [{ rotateX: tilt }, { rotateZ: spin }] 
                      }
                    ]}
                  >
                    <View style={styles.floorLayer}>
                      {floors[floorNum].map((unit) => {
                        const left = offsetX + (unit.gridX - b.minX) * dynamicCellSize;
                        const top = offsetY + (unit.gridY - b.minY) * dynamicCellSize;
                        const width = unit.gridWidth * dynamicCellSize;
                        const height = unit.gridHeight * dynamicCellSize;

                        const activeCount = unit.activeLeases ? unit.activeLeases.length : 0;
                        const capacity = unit.capacity || 1;
                        
                        let unitBackgroundColor = '';
                        let unitBorderColor = '';

                        if (activeCount === 0) {
                          // VACANT: Primary Brand Color
                          unitBackgroundColor = isHovered ? theme.Colors.primary : theme.Colors.primaryContainer;
                          unitBorderColor = isHovered ? theme.Colors.surfaceContainerLowest : theme.Colors.primary;
                        } else if (activeCount < capacity) {
                          // PARTIAL: Tertiary Warning Color
                          unitBackgroundColor = isHovered ? theme.Colors.tertiaryFixedDim : theme.Colors.tertiaryContainer;
                          unitBorderColor = isHovered ? theme.Colors.surfaceContainerLowest : theme.Colors.tertiary;
                        } else {
                          // OCCUPIED: Error Color
                          unitBackgroundColor = isHovered ? theme.Colors.error : theme.Colors.errorContainer;
                          unitBorderColor = isHovered ? theme.Colors.surfaceContainerLowest : theme.Colors.error;
                        }

                        return (
                          <View
                            key={unit.id}
                            style={[
                              styles.unitBlock,
                              { 
                                left, 
                                top, 
                                width, 
                                height, 
                                backgroundColor: unitBackgroundColor, 
                                borderColor: unitBorderColor, 
                                borderWidth: 1.5,
                                borderRadius: Math.min(4, Math.max(1, dynamicCellSize * 0.08)),
                                alignItems: 'center',
                                justifyContent: 'center',
                              }
                            ]}
                          >
                            {dynamicCellSize >= 34 && (
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: Math.max(9, Math.min(13, dynamicCellSize * 0.22)),
                                  fontWeight: '800',
                                  color: isDark ? '#FFFFFF' : theme.Colors.onSurface,
                                  opacity: 0.95,
                                  transform: [{ rotateZ: '-135deg' }],
                                }}
                              >
                                {unit.unitNumber}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    ...Platform.select({
      web: {
        touchAction: 'none',
        userSelect: 'none',
      }
    }) as any,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.labelSmall.fontSize,
  },
  isometricWrapper: {
    // Width and height are set dynamically inline
  },
  floorLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 5,
  },
  unitBlock: {
    position: 'absolute',
    borderWidth: 0.5,
    borderRadius: 1,
  },
  slabExtrusion: {
    backgroundColor: 'rgba(0, 60, 70, 0.4)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 2,
  },
  legendContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.Colors.outlineVariant,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
});
