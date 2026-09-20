import { useAppTheme, AppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Animated, PanResponder, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAllFloorsLayout, UnitResponse } from '@/src/features/properties/api/unit.api';
import { logger } from '@/src/utils/logger';

// Design System & Motion Constants
const SKELETON_PULSE_DURATION = 900;
const SKELETON_PLATE_WIDTH = 120;
const SKELETON_PLATE_HEIGHT = 72;
const DEFAULT_MAX_CONTAINER_HEIGHT = 260;
const DEFAULT_CONTAINER_WIDTH = 280;
const ISO_PROJECTION_COS_45 = Math.SQRT1_2;
const ISO_WIDTH_SCALE_FACTOR = 0.78;
const MAX_CELL_SIZE = 76;
const MIN_CELL_SIZE = 12;
const MIN_CELL_SIZE_FOR_LABEL = 34;
const HOVER_ELEVATION_OFFSET = -14;
const SPRING_FRICTION = 6;
const SPRING_TENSION = 50;
const PAN_MOVE_THRESHOLD = 3;
const TAP_DISTANCE_THRESHOLD = 6;
const ROTATION_SENSITIVITY = 0.5;
const MIN_PITCH_ANGLE = 20;
const MAX_PITCH_ANGLE = 80;
const STACK_BASE_OFFSET_Y = 10;
const DIMENSION_CHANGE_THRESHOLD = 5;
const PLATE_HEIGHT_SCALE_FACTOR = 0.88;
const MIN_PLATE_HEIGHT_CONSTRAINT = 50;
const ISO_PROJECTED_HEIGHT_FACTOR = 0.36;
const ISO_VISUAL_PROJECTION_FACTOR = 0.4;
const LEGEND_Z_INDEX = 20;
const SHADOW_OPACITY_DARK = 0.35;
const SHADOW_OPACITY_LIGHT = 0.08;

interface Building3DViewProps {
  propertyId: string;
  token: string;
  blockId?: string | null;
  onFloorClick?: (floorNum: number) => void;
  resetRotationTrigger?: number;
  maxContainerHeight?: number;
  hideLegend?: boolean;
}

function Building3DSkeleton({ isDark, theme }: { isDark: boolean; theme: AppTheme }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const styles = React.useMemo(() => createStyles3DSkeleton(theme), [theme]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: SKELETON_PULSE_DURATION, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: SKELETON_PULSE_DURATION, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.wrapper, { opacity: pulseAnim }]}>
      {[0, 1, 2].map((idx) => (
        <View
          key={idx}
          style={[
            styles.plate,
            {
              transform: [
                { translateY: -idx * theme.Spacing.lg + theme.Spacing.md },
                { rotateX: '60deg' },
                { rotateZ: '-45deg' },
              ],
            },
          ]}
        >
          <View style={styles.gridRow}>
            <View style={[styles.cell, { flex: 1, backgroundColor: theme.Colors.primaryContainer }]} />
            <View style={[styles.cell, { flex: 1.2, backgroundColor: theme.Colors.surfaceContainerHigh }]} />
            <View style={[styles.cell, { flex: 0.8, backgroundColor: theme.Colors.primaryContainer }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const createStyles3DSkeleton = (theme: AppTheme) => StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plate: {
    position: 'absolute',
    width: SKELETON_PLATE_WIDTH,
    height: SKELETON_PLATE_HEIGHT,
    borderRadius: theme.Rounded.sm,
    borderWidth: theme.Borders.card,
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerLow,
    padding: theme.Spacing.xs,
    backfaceVisibility: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    gap: theme.Spacing.xs,
    flex: 1,
  },
  cell: {
    borderRadius: theme.Rounded.xs,
    height: '100%',
  },
});

export default function Building3DView({
  propertyId,
  token,
  blockId,
  onFloorClick,
  resetRotationTrigger,
  maxContainerHeight = DEFAULT_MAX_CONTAINER_HEIGHT,
  hideLegend = false,
}: Building3DViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { data: units = [], isLoading: loading } = useQuery<UnitResponse[]>({
    queryKey: ['property-layouts', propertyId, blockId ?? 'all'],
    queryFn: () => getAllFloorsLayout(propertyId, token, blockId),
    enabled: !!propertyId && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const containerRef = useRef<View>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: DEFAULT_CONTAINER_WIDTH,
    height: maxContainerHeight,
  });

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (Math.abs(containerDimensions.width - width) > DIMENSION_CHANGE_THRESHOLD || Math.abs(containerDimensions.height - height) > DIMENSION_CHANGE_THRESHOLD) {
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
  const rawIsoWidth = (gridW + gridH) * ISO_PROJECTION_COS_45;
  const maxCellSizeWidth = Math.floor((availableWidth * ISO_WIDTH_SCALE_FACTOR) / (rawIsoWidth || 1));

  // Max height in 60-degree tilt: single plate projected height = (gridW + gridH) * dynamicCellSize * ISO_PROJECTED_HEIGHT_FACTOR
  const remainingHeightForPlate = Math.max(availableHeight * PLATE_HEIGHT_SCALE_FACTOR - stackHeightOffset, MIN_PLATE_HEIGHT_CONSTRAINT);
  const maxCellSizeHeight = Math.floor(remainingHeightForPlate / (((gridW + gridH) * ISO_PROJECTED_HEIGHT_FACTOR) || 1));

  let dynamicCellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);

  // Generous clamp: allows small floor layouts (e.g. 2x1, 2x2, 3x2) to scale up beautifully
  if (dynamicCellSize > MAX_CELL_SIZE) dynamicCellSize = MAX_CELL_SIZE;
  if (dynamicCellSize < MIN_CELL_SIZE) dynamicCellSize = MIN_CELL_SIZE;

  const buildingWidth = gridW * dynamicCellSize;
  const buildingHeight = gridH * dynamicCellSize;

  const visualIsoHeight = (gridW + gridH) * dynamicCellSize * ISO_VISUAL_PROJECTION_FACTOR;
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
      const toValue = fNum === hoveredFloor ? HOVER_ELEVATION_OFFSET : 0;
      return Animated.spring(floorElevations[fNum], {
        toValue,
        useNativeDriver: false,
        friction: SPRING_FRICTION,
        tension: SPRING_TENSION,
      });
    });
    Animated.parallel(animations).start();
  }, [hoveredFloor]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > PAN_MOVE_THRESHOLD || Math.abs(gestureState.dy) > PAN_MOVE_THRESHOLD,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => Math.abs(gestureState.dx) > PAN_MOVE_THRESHOLD || Math.abs(gestureState.dy) > PAN_MOVE_THRESHOLD,
      onPanResponderGrant: () => {
        isDragging.current = true;
        rotateZ.stopAnimation();
        rotateX.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        const newRotZ = lastRotation.current - gestureState.dx * ROTATION_SENSITIVITY;
        let newRotX = lastRotationX.current - gestureState.dy * ROTATION_SENSITIVITY;
        if (newRotX < MIN_PITCH_ANGLE) newRotX = MIN_PITCH_ANGLE;
        if (newRotX > MAX_PITCH_ANGLE) newRotX = MAX_PITCH_ANGLE;

        rotateZ.setValue(newRotZ);
        rotateX.setValue(newRotX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        setHoveredFloor(null);

        lastRotation.current -= gestureState.dx * ROTATION_SENSITIVITY;
        let newRotX = lastRotationX.current - gestureState.dy * ROTATION_SENSITIVITY;
        if (newRotX < MIN_PITCH_ANGLE) newRotX = MIN_PITCH_ANGLE;
        if (newRotX > MAX_PITCH_ANGLE) newRotX = MAX_PITCH_ANGLE;
        lastRotationX.current = newRotX;

        // Tap handling for floor click
        if (Math.abs(gestureState.dx) < TAP_DISTANCE_THRESHOLD && Math.abs(gestureState.dy) < TAP_DISTANCE_THRESHOLD) {
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
      style={styles.outerWrapper}
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
          {!hideLegend && (
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
          )}

          <View 
            ref={containerRef}
            style={[
              styles.container, 
              { 
                width: buildingWidth + theme.Spacing.xl + theme.Spacing.sm,
                height: containerHeight
              }
            ]}
            {...panResponder.panHandlers}
          >
            {floorNumbers.map((floorNum) => {
              const elevationAnim = floorElevations[floorNum] || new Animated.Value(0);
              const baseTranslateY = -(floorNum - minFloor) * dynamicFloorHeight + stackHeightOffset / 2 + STACK_BASE_OFFSET_Y;
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
                          backgroundColor: isHovered ? theme.Colors.primaryContainer : theme.Colors.surfaceContainerHigh,
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
                                borderWidth: theme.Borders.unit,
                                borderRadius: theme.Rounded.xs,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }
                            ]}
                          >
                            {dynamicCellSize >= MIN_CELL_SIZE_FOR_LABEL && (
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: theme.Typography.labelSmall.fontSize,
                                  fontWeight: theme.Typography.labelCaps.fontWeight,
                                  color: theme.Colors.onPrimary,
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

const createStyles = (theme: AppTheme, isDark: boolean) => StyleSheet.create({
  outerWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
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
    width: theme.Spacing.xxl * 4,
    height: theme.Spacing.xxl * 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    width: theme.Spacing.xxl * 4,
    height: theme.Spacing.xxl * 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.Borders.card,
    borderColor: theme.Colors.glassStroke,
    borderRadius: theme.Rounded.sm,
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
    borderWidth: theme.Borders.unit,
    borderRadius: theme.Rounded.xs,
  },
  slabExtrusion: {
    backgroundColor: theme.Colors.primaryContainer,
    borderColor: theme.Colors.glassStroke,
    borderWidth: theme.Borders.card,
    borderRadius: theme.Rounded.xs,
  },
  legendContainer: {
    position: 'absolute',
    top: 38,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.75)',
    borderColor: theme.Colors.glassStroke,
    borderWidth: theme.Borders.card,
    borderRadius: theme.Rounded.default,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    zIndex: LEGEND_Z_INDEX,
    ...theme.Shadows.low,
    shadowColor: theme.Surface.shadowColor,
    shadowOpacity: isDark ? SHADOW_OPACITY_DARK : SHADOW_OPACITY_LIGHT,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  legendDot: {
    width: theme.Spacing.sm,
    height: theme.Spacing.sm,
    borderRadius: theme.Rounded.xs,
  },
  legendText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: theme.Typography.labelCaps.fontWeight,
    color: theme.Colors.onSurface,
  },
});
