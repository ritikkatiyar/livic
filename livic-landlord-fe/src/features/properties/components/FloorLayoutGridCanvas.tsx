import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UnitBlock } from '../hooks/useFloorLayoutViewer';
import { AppTheme, useAppTheme } from '@/src/theme/ThemeContext';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface FloorLayoutGridCanvasProps {
  blocks: UnitBlock[];
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  resetTenantAssignmentForm: () => void;
  getBlockColorStyles: (block: UnitBlock) => { backgroundColor: string; borderColor: string; textColor: string };
  theme?: AppTheme;
  originX?: number;
  originY?: number;
  cols?: number;
  rows?: number;
  cellSize?: number;
  is3DMode?: boolean;
}

export function FloorLayoutGridCanvas({
  blocks,
  selectedUnitId,
  setSelectedUnitId,
  resetTenantAssignmentForm,
  getBlockColorStyles,
  theme: propTheme,
  originX = 0,
  originY = 0,
  cols = 4,
  rows = 3,
  cellSize = 96,
  is3DMode = true,
}: FloorLayoutGridCanvasProps) {
  const { theme: appTheme, isDark } = useAppTheme();
  const theme = propTheme || appTheme;
  const localStyles = React.useMemo(() => createLocalStyles(theme, isDark), [theme, isDark]);

  const gridCells: React.ReactNode[] = [];
  const occupiedGridMap: { [key: string]: boolean } = {};

  blocks.forEach((block) => {
    for (let x = block.gridX; x < block.gridX + block.gridWidth; x++) {
      for (let y = block.gridY; y < block.gridY + block.gridHeight; y++) {
        if (x !== block.gridX || y !== block.gridY) {
          occupiedGridMap[`${x},${y}`] = true;
        }
      }
    }
  });

  for (let ry = 0; ry < rows; ry++) {
    for (let rx = 0; rx < cols; rx++) {
      const x = originX + rx;
      const y = originY + ry;

      if (occupiedGridMap[`${x},${y}`]) continue;

      const block = blocks.find((b) => b.gridX === x && b.gridY === y);
      const isSelected = block && selectedUnitId === block.id;

      const cellLeft = rx * cellSize;
      const cellTop = ry * cellSize;
      const cellWidth = (block ? block.gridWidth : 1) * cellSize;
      const cellHeight = (block ? block.gridHeight : 1) * cellSize;

      if (!block) {
        // Empty blueprint grid cell with architectural crosshair markings
        gridCells.push(
          <View
            key={`empty-${x}-${y}`}
            style={[
              localStyles.emptyBlueprintCell,
              {
                left: cellLeft,
                top: cellTop,
                width: cellWidth,
                height: cellHeight,
              },
            ]}
            pointerEvents="none"
          >
            <View style={localStyles.crosshair} />
          </View>
        );
        continue;
      }

      // Unit room block
      const colorStyles = getBlockColorStyles(block);
      const activeCount = block.activeLeases ? block.activeLeases.length : 0;
      const cap = block.capacity || 1;
      const isVacant = activeCount === 0;
      const primaryTenant = block.tenants && block.tenants.length > 0 ? block.tenants[0] : null;
      const typeLabel = UNIT_TYPE_OPTIONS.find((opt) => opt.value === block.type)?.label || 'Unit';

      gridCells.push(
        <View
          key={`unit-${block.id}`}
          style={[
            localStyles.unitContainer,
            {
              left: cellLeft,
              top: cellTop,
              width: cellWidth,
              height: cellHeight,
              zIndex: isSelected ? 50 : 15,
            },
          ]}
        >
          {/* 3D Wall Drop-Shadow & Slab Extrusion in 3D Mode */}
          {is3DMode && (
            <View
              style={[
                localStyles.extrusionShadow,
                isSelected && localStyles.extrusionShadowSelected,
                {
                  width: cellWidth,
                  height: cellHeight,
                },
              ]}
            />
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              setSelectedUnitId(block.id);
              resetTenantAssignmentForm();
            }}
            style={[
              localStyles.roomCard,
              {
                backgroundColor: colorStyles.backgroundColor,
                borderColor: colorStyles.borderColor,
              },
              isSelected && localStyles.roomCardSelected,
            ]}
          >
            {/* Header: Unit Number & Type */}
            <View style={localStyles.roomHeader}>
              <View style={localStyles.unitBadge}>
                <Text style={localStyles.unitNumberText}>{block.unitNumber}</Text>
              </View>
              <Text numberOfLines={1} style={localStyles.unitTypeText}>
                {typeLabel}
              </Text>
            </View>

            {/* Middle: Tenant Info / Vacant State */}
            <View style={localStyles.tenantRow}>
              <MaterialIcons
                name={isVacant ? 'meeting-room' : 'person'}
                size={theme.Spacing.md}
                color={theme.Colors.onSurface}
              />
              <Text numberOfLines={1} style={localStyles.tenantNameText}>
                {isVacant ? 'Vacant' : primaryTenant || 'Occupied'}
              </Text>
            </View>

            {/* Footer: Rent & Capacity Indicator */}
            <View style={localStyles.roomFooter}>
              {block.rent ? (
                <View style={localStyles.rentChip}>
                  <Text style={localStyles.rentText}>₹{Number(block.rent).toLocaleString()}</Text>
                </View>
              ) : (
                <View style={[localStyles.rentChip, localStyles.rentChipMuted]}>
                  <Text style={localStyles.rentText}>No Rent</Text>
                </View>
              )}

              <View style={localStyles.statusPill}>
                <View
                  style={[
                    localStyles.statusDot,
                    isVacant && localStyles.statusDotVacant,
                    isSelected && localStyles.statusDotSelected,
                  ]}
                />
                <Text style={localStyles.statusText}>
                  {isVacant ? 'OPEN' : `${activeCount}/${cap}`}
                </Text>
              </View>
            </View>

            {/* Selected Corner Checkmark */}
            {isSelected && (
              <View style={localStyles.selectedBadge}>
                <MaterialIcons name="check" size={theme.Typography.bodySmall.fontSize} color={theme.Colors.onPrimary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }
  }

  return <>{gridCells}</>;
}

const createLocalStyles = (theme: AppTheme, isDark: boolean) => StyleSheet.create({
  unitContainer: {
    position: 'absolute',
  },
  emptyBlueprintCell: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.Rounded.sm,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: theme.Spacing.sm,
    height: theme.Spacing.sm,
    borderRadius: theme.Rounded.xs,
    backgroundColor: theme.Colors.outlineVariant,
    opacity: 0.6,
  },
  extrusionShadow: {
    position: 'absolute',
    top: theme.Spacing.xs,
    left: theme.Spacing.xs,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerHighest,
  },
  extrusionShadowSelected: {
    backgroundColor: theme.Colors.primaryContainer,
  },
  roomCard: {
    width: '100%',
    height: '100%',
    borderRadius: theme.Rounded.md,
    padding: theme.Spacing.sm,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: theme.Surface.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  roomCardSelected: {
    borderColor: theme.Colors.surfaceTint,
    borderWidth: 2,
    shadowColor: theme.Colors.surfaceTint,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.Spacing.xs,
  },
  unitBadge: {
    backgroundColor: theme.Colors.glassFill,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.xs,
  },
  unitNumberText: {
    fontSize: theme.Typography.titleSmall.fontSize,
    fontWeight: theme.Typography.buttonText.fontWeight,
    color: theme.Colors.onSurface,
    letterSpacing: -0.3,
  },
  unitTypeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: theme.Typography.labelSmall.fontWeight,
    color: theme.Colors.onSurfaceVariant,
    flexShrink: 1,
    textAlign: 'right',
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    backgroundColor: theme.Colors.surfaceContainerLow,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.xs,
    marginVertical: theme.Spacing.xs,
  },
  tenantNameText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: theme.Typography.buttonText.fontWeight,
    color: theme.Colors.onSurface,
    flexShrink: 1,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.Spacing.xs,
  },
  rentChip: {
    backgroundColor: theme.Colors.surfaceContainerHigh,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.xs,
  },
  rentChipMuted: {
    opacity: 0.7,
  },
  rentText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: theme.Typography.buttonText.fontWeight,
    color: theme.Colors.onSurface,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    backgroundColor: theme.Colors.glassFill,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.xs,
  },
  statusDot: {
    width: theme.Spacing.sm,
    height: theme.Spacing.sm,
    borderRadius: theme.Rounded.xs,
    backgroundColor: theme.Colors.onSurfaceVariant,
  },
  statusDotVacant: {
    backgroundColor: theme.Colors.primary,
  },
  statusDotSelected: {
    backgroundColor: theme.Colors.surfaceTint,
  },
  statusText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: theme.Typography.buttonText.fontWeight,
    color: theme.Colors.onSurface,
  },
  selectedBadge: {
    position: 'absolute',
    top: theme.Spacing.xs,
    right: theme.Spacing.xs,
    width: theme.Spacing.md,
    height: theme.Spacing.md,
    borderRadius: theme.Rounded.sm,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.Surface.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
});
