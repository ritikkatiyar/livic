import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const GRID_SIZE_X = 10;
const GRID_SIZE_Y = 15;
const CELL_SIZE = 70;

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface UnitBlock {
  id: string;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  activeLeases?: any[];
  type?: string;
}

interface EditorGridProps {
  blocks: UnitBlock[];
  selectedUnitId: string | null;
  activeTool: 'PAN' | 'ADD' | 'ERASE';
  currentDrawBlock: { startX: number, startY: number, endX: number, endY: number } | null;
  handleBlockPress: (index: number) => void;
}

export function EditorGrid({
  blocks,
  selectedUnitId,
  activeTool,
  currentDrawBlock,
  handleBlockPress,
}: EditorGridProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const getBlockColorStyles = (b: UnitBlock) => {
    const activeCount = b.activeLeases ? b.activeLeases.length : 0;
    const capacity = b.capacity || 1;

    if (activeCount === 0) {
      return {
        backgroundColor: theme.Colors.primary,
        borderColor: theme.Colors.primary,
        textColor: '#ffffff',
        accentColor: '#c8e6c9'
      };
    } else if (activeCount < capacity) {
      return {
        backgroundColor: theme.Colors.secondary,
        borderColor: theme.Colors.secondary,
        textColor: '#ffffff',
        accentColor: '#fff3e0'
      };
    } else {
      return {
        backgroundColor: theme.Colors.error,
        borderColor: theme.Colors.error,
        textColor: '#ffffff',
        accentColor: '#ffcdd2'
      };
    }
  };

  const rows = [];
  let previewBlockState = null;
  if (currentDrawBlock) {
    const minX = Math.min(currentDrawBlock.startX, currentDrawBlock.endX);
    const minY = Math.min(currentDrawBlock.startY, currentDrawBlock.endY);
    const w = Math.abs(currentDrawBlock.startX - currentDrawBlock.endX) + 1;
    const h = Math.abs(currentDrawBlock.startY - currentDrawBlock.endY) + 1;
    previewBlockState = { gridX: minX, gridY: minY, w, h };
  }

  for (let y = 0; y < GRID_SIZE_Y; y++) {
    const cols = [];
    for (let x = 0; x < GRID_SIZE_X; x++) {
      const block = blocks.find(b => b.gridX === x && b.gridY === y);
      const isPreviewStart = previewBlockState && previewBlockState.gridX === x && previewBlockState.gridY === y;

      cols.push(
        <View
          key={`${x}-${y}`}
          style={[styles.cell, styles.cellEmpty]}
          pointerEvents="box-none"
        >
          {block && (() => {
            const colorStyles = getBlockColorStyles(block);
            const isSelected = selectedUnitId === block.id;
            const activeCount = block.activeLeases ? block.activeLeases.length : 0;
            const cap = block.capacity || 1;
            const isVacant = activeCount === 0;

            return (
              <View
                pointerEvents={activeTool === 'ADD' ? 'none' : 'auto'}
                style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  width: block.gridWidth * CELL_SIZE,
                  height: block.gridHeight * CELL_SIZE,
                  zIndex: isSelected ? 50 : 10,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleBlockPress(blocks.indexOf(block))}
                  style={[
                    styles.cellActive,
                    {
                      width: '100%',
                      height: '100%',
                      backgroundColor: colorStyles.backgroundColor,
                      borderColor: isSelected ? theme.Colors.onSurface : colorStyles.borderColor,
                      borderWidth: isSelected ? 3 : 2,
                      justifyContent: 'space-between',
                      paddingVertical: block.gridHeight >= 2 ? 6 : 4,
                      paddingHorizontal: block.gridWidth >= 2 ? 6 : 4,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'column', gap: 2 }}>
                    <Text style={[styles.cellText, { color: colorStyles.textColor }]}>{block.unitNumber}</Text>
                    <Text style={{ fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: colorStyles.textColor + 'ee' }}>
                      {UNIT_TYPE_OPTIONS.find(opt => opt.value === block.type)?.label || '1 BHK'}
                    </Text>
                  </View>

                  {block.gridWidth >= 2 || block.gridHeight >= 2 ? (
                    <View style={styles.badgeLarge}>
                      <View style={[styles.statusDot, { backgroundColor: colorStyles.backgroundColor, borderColor: colorStyles.borderColor }]} />
                      <Text style={styles.badgeText}>
                        {isVacant ? 'OPEN' : `${activeCount}/${cap}`}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.badgeSmall}>
                      <View style={[styles.statusDotSmall, { backgroundColor: colorStyles.backgroundColor, borderColor: colorStyles.borderColor }]} />
                      <Text style={styles.badgeTextSmall}>
                        {isVacant ? '—' : `${activeCount}/${cap}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })()}
          {isPreviewStart && previewBlockState && (
            <View
              pointerEvents="none"
              style={[
                styles.cellDrawingStart,
                {
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  width: previewBlockState.w * CELL_SIZE,
                  height: previewBlockState.h * CELL_SIZE,
                  zIndex: 20,
                }
              ]}
            />
          )}
        </View>
      );
    }
    rows.push(
      <View key={`row-${y}`} style={styles.gridRow} pointerEvents="box-none">
        {cols}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {rows}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  grid: {
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.45)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 104, 117, 0.15)',
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 104, 117, 0.08)',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellActive: {
    borderRadius: 8,
    borderWidth: 1.5,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  cellText: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  cellDrawingStart: {
    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 104, 117, 0.25)',
    borderColor: theme.Colors.primary,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  badgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: theme.Spacing.xs,
  },
  badgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  badgeTextSmall: {
    fontSize: theme.Typography.labelSmall.fontSize - 3,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
});
