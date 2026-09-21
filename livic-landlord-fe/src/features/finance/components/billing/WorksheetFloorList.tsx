import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { WorksheetEntryResponse } from '@/src/features/finance/api/worksheet.api';
import type { ChargeConfigResponse } from '@/src/features/finance/api/charge.api';

interface WorksheetFloorListProps {
  entries: WorksheetEntryResponse[];
  editValues: Record<string, string>;
  setEditValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedCharge: ChargeConfigResponse | undefined;
  propertyId: string | null;
}

export function WorksheetFloorList({
  entries,
  editValues,
  setEditValues,
  selectedCharge,
  propertyId,
}: WorksheetFloorListProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();

  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});
  const [floorPages, setFloorPages] = useState<Record<number, number>>({});
  const [floorPage, setFloorPage] = useState(1);

  const toggleFloor = (floor: number) => {
    setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
  };

  useEffect(() => {
    if (entries.length > 0) {
      setExpandedFloors({});
      setFloorPages({});
      setFloorPage(1);
    }
  }, [entries]);

  const groupedWorksheet = entries.reduce((acc, row) => {
    const floor = row.floor ?? 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(row);
    return acc;
  }, {} as Record<number, typeof entries>);

  const sortedFloors = Object.keys(groupedWorksheet).map(Number).sort((a, b) => a - b);

  return (
    <View style={{ flex: 1 }}>
      {sortedFloors.map(floor => {
        const isExpanded = expandedFloors[floor];
        return (
          <View key={`floor-${floor}`} style={styles.floorCard}>
            <TouchableOpacity 
              style={styles.floorHeader}
              onPress={() => toggleFloor(floor)}
              activeOpacity={0.7}
            >
              <Text style={styles.floorHeaderText}>
                {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
              </Text>
              <MaterialIcons 
                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color={theme.Colors.primary} 
              />
            </TouchableOpacity>
            
            {(() => {
              if (!isExpanded) return null;
              const unitsPerFloorPage = 4;
              const floorUnits = groupedWorksheet[floor] || [];
              const totalFloorPagesUnits = Math.ceil(floorUnits.length / unitsPerFloorPage);
              const currentPage = floorPages[floor] || 1;
              const startIndex = (currentPage - 1) * unitsPerFloorPage;
              const paginatedUnits = floorUnits.slice(startIndex, startIndex + unitsPerFloorPage);

              return (
                <>
                  {paginatedUnits.map((entry, index) => {
                    const isLast = index === paginatedUnits.length - 1;
                    return (
                      <View key={entry.id} style={[styles.rowCard, isLast && { borderBottomWidth: 0 }]}>
                        <View style={styles.rowLeft}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {Boolean(entry.blockName) && (
                              <View style={styles.blockBadge}>
                                <Text style={styles.blockBadgeText}>{entry.blockName}</Text>
                              </View>
                            )}
                            <Text style={styles.unitName}>{entry.unitName}</Text>
                          </View>
                          <Text style={styles.tenantName} numberOfLines={1}>{entry.tenantName}</Text>
                        </View>
                        
                        <View style={styles.rowRight}>
                          {entry.isBilled ? (
                            <View style={styles.billedBadge}>
                              <Text style={styles.billedBadgeText}>BILLED (₹{entry.enteredValue})</Text>
                            </View>
                          ) : (
                            selectedCharge?.calculationStrategy === 'METERED' ? (
                              <TouchableOpacity 
                                style={styles.meteredButton}
                                onPress={() => router.push(`/properties/${propertyId}/meter-readings`)}
                              >
                                <MaterialIcons name="speed" size={16} color={theme.Colors.primary} />
                                <Text style={styles.meteredButtonText}>Enter Readings</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.inputWrapper}>
                                {selectedCharge?.calculationStrategy !== 'METERED' && (
                                  <Text style={styles.currencySymbol}>₹</Text>
                                )}
                                <TextInput
                                  style={[styles.input, selectedCharge?.calculationStrategy !== 'METERED' && { paddingLeft: theme.Spacing.lg }]}
                                  value={editValues[entry.unitId] || ''}
                                  onChangeText={(val) => setEditValues(prev => ({ ...prev, [entry.unitId]: val }))}
                                  keyboardType="numeric"
                                  placeholder="0"
                                  placeholderTextColor={theme.Colors.outlineVariant}
                                />
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    );
                  })}
                  
                  {totalFloorPagesUnits > 1 && (
                    <View style={styles.paginationRow}>
                      <TouchableOpacity 
                        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                        disabled={currentPage === 1}
                        onPress={() => setFloorPages(prev => ({ ...prev, [floor]: currentPage - 1 }))}
                      >
                        <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? '#a0aab2' : theme.Colors.primary} />
                        <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Prev</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.pageInfoText}>
                        Page {currentPage} of {totalFloorPagesUnits}
                      </Text>
                      
                      <TouchableOpacity 
                        style={[styles.pageButton, currentPage === totalFloorPagesUnits && styles.pageButtonDisabled]}
                        disabled={currentPage === totalFloorPagesUnits}
                        onPress={() => setFloorPages(prev => ({ ...prev, [floor]: currentPage + 1 }))}
                      >
                        <Text style={[styles.pageButtonText, currentPage === totalFloorPagesUnits && styles.pageButtonTextDisabled]}>Next</Text>
                        <MaterialIcons name="chevron-right" size={20} color={currentPage === totalFloorPagesUnits ? '#a0aab2' : theme.Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  floorCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    marginVertical: 10,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  floorHeaderText: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  unitName: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  blockBadge: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  blockBadgeText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  tenantName: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  rowRight: {
    width: 140,
    alignItems: 'flex-end',
  },
  billedBadge: {
    backgroundColor: 'rgba(0, 104, 117, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.24)',
  },
  billedBadgeText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  meteredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    borderColor: 'rgba(0, 104, 117, 0.3)',
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  meteredButtonText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    color: theme.Colors.onSurface,
    paddingHorizontal: 12,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outlineVariant,
  },
  mainPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.Spacing.md,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  pageButtonTextDisabled: {
    color: theme.Colors.onSurfaceVariant,
  },
  pageInfoText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
