import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UnitBlock } from '../hooks/useFloorLayoutViewer';

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
  styles: any;
  theme: any;
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
  styles: externalStyles,
  theme,
  originX = 0,
  originY = 0,
  cols = 4,
  rows = 3,
  cellSize = 96,
  is3DMode = true,
}: FloorLayoutGridCanvasProps) {
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
                borderColor: theme.Colors.outlineVariant || 'rgba(0, 104, 117, 0.12)',
              },
            ]}
            pointerEvents="none"
          >
            <View style={[localStyles.crosshair, { backgroundColor: theme.Colors.outlineVariant || 'rgba(0, 104, 117, 0.15)' }]} />
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
          style={{
            position: 'absolute',
            left: cellLeft,
            top: cellTop,
            width: cellWidth,
            height: cellHeight,
            zIndex: isSelected ? 50 : 15,
          }}
        >
          {/* 3D Wall Drop-Shadow & Slab Extrusion in 3D Mode */}
          {is3DMode && (
            <View
              style={[
                localStyles.extrusionShadow,
                {
                  width: cellWidth,
                  height: cellHeight,
                  backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 50, 70, 0.25)',
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
                width: '100%',
                height: '100%',
                backgroundColor: colorStyles.backgroundColor,
                borderColor: isSelected ? '#00e5ff' : colorStyles.borderColor,
                borderWidth: isSelected ? 2.5 : 1.5,
                shadowColor: isSelected ? '#00e5ff' : '#000000',
                shadowOpacity: isSelected ? 0.45 : 0.18,
                shadowRadius: isSelected ? 10 : 5,
                elevation: isSelected ? 8 : 3,
              },
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
                size={14}
                color="rgba(255, 255, 255, 0.9)"
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
                <View style={[localStyles.rentChip, { opacity: 0.7 }]}>
                  <Text style={localStyles.rentText}>No Rent Set</Text>
                </View>
              )}

              <View style={localStyles.statusPill}>
                <View
                  style={[
                    localStyles.statusDot,
                    { backgroundColor: isVacant ? '#4ade80' : isSelected ? '#00e5ff' : '#ffffff' },
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
                <MaterialIcons name="check" size={12} color="#000000" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }
  }

  return <>{gridCells}</>;
}

const localStyles = StyleSheet.create({
  emptyBlueprintCell: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  extrusionShadow: {
    position: 'absolute',
    top: 5,
    left: 4,
    borderRadius: 12,
  },
  roomCard: {
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  unitBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  unitTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    flexShrink: 1,
    textAlign: 'right',
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginVertical: 2,
  },
  tenantNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 1,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  rentChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
});
