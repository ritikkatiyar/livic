import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MeterReadingResponse } from '@/src/features/finance/api/meterReading.api';
import { withAlpha } from '@/src/theme/colorUtils';

interface MeterReadingFloorCardProps {
  floor: number;
  isExpanded: boolean;
  toggleFloor: () => void;
  floorUnits: MeterReadingResponse[];
  currentPage: number;
  setPage: (page: number) => void;
  inputs: Record<string, string>;
  setInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  prevInputs: Record<string, string>;
  setPrevInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  inputRefs: React.MutableRefObject<Record<string, TextInput | null>>;
  baseRate: number;
  unitType: string | undefined;
}

export function MeterReadingFloorCard({
  floor,
  isExpanded,
  toggleFloor,
  floorUnits,
  currentPage,
  setPage,
  inputs,
  setInputs,
  prevInputs,
  setPrevInputs,
  inputRefs,
  baseRate,
  unitType,
}: MeterReadingFloorCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const unitsPerFloorPage = 4;
  const totalFloorPagesUnits = Math.ceil(floorUnits.length / unitsPerFloorPage);
  const startIndex = (currentPage - 1) * unitsPerFloorPage;
  const paginatedUnits = floorUnits.slice(startIndex, startIndex + unitsPerFloorPage);

  return (
    <View style={styles.floorCard}>
      <TouchableOpacity 
        style={styles.floorHeader}
        onPress={toggleFloor}
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
      
      {isExpanded && (
        <>
          {paginatedUnits.map((row, index) => {
            const prevStr = prevInputs[row.unitId];
            const prevVal = prevStr !== undefined && prevStr !== '' ? parseFloat(prevStr) : 0;
            const currentStr = inputs[row.unitId];
            const currentVal = currentStr !== undefined && currentStr.trim() !== '' ? parseFloat(currentStr) : null;
            const isInvalidPrev = isNaN(prevVal);
            const isInvalidCurrent = currentVal !== null && isNaN(currentVal);
            const isError = currentVal !== null && !isInvalidPrev && !isInvalidCurrent && currentVal < prevVal;
            const consumed = currentVal !== null && !isInvalidPrev && !isInvalidCurrent ? Math.max(0, currentVal - prevVal) : 0;
            const estCost = consumed * baseRate;
            const isLast = index === paginatedUnits.length - 1;
            
            return (
              <View key={row.id} style={[styles.rowCard, isError && styles.rowError, isLast && { borderBottomWidth: 0 }]}>
                <View style={styles.rowLeft}>
                  <Text style={styles.unitName}>{row.unitName}</Text>
                  <Text style={styles.tenantName}>{row.tenantName}</Text>
                  {!row.isBilled ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.Spacing.xs }}>
                      <Text style={[styles.prevReading, { marginRight: 6 }]}>Prev:</Text>
                      <TextInput
                        style={styles.prevTextInput}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.Colors.onSurfaceVariant}
                        value={prevInputs[row.unitId] ?? ''}
                        onChangeText={(val) => setPrevInputs(prev => ({ ...prev, [row.unitId]: val }))}
                      />
                    </View>
                  ) : (
                    <Text style={styles.prevReading}>Prev: {row.previousReading ?? 0}</Text>
                  )}
                </View>
                
                <View style={styles.rowMiddle}>
                  {currentVal !== null && !isInvalidCurrent && (
                    <>
                      <Text style={[styles.consumedText, isError && { color: theme.Colors.error }]}>
                        {consumed > 0 ? '+' : ''}{consumed} {unitType || 'Units'}
                      </Text>
                      {!isError && <Text style={styles.costText}>Est: ₹{estCost.toFixed(2)}</Text>}
                    </>
                  )}
                </View>
                
                <View style={styles.rowRight}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <TextInput
                      ref={(ref) => { inputRefs.current[row.unitId] = ref; }}
                      style={[styles.input, isError && styles.inputError, { flex: 1 }]}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={theme.Colors.onSurfaceVariant}
                      value={inputs[row.unitId] ?? ''}
                      onChangeText={(val) => setInputs(prev => ({ ...prev, [row.unitId]: val }))}
                      returnKeyType="next"
                      editable={!row.isBilled}
                    />
                    <Text style={styles.unitTypeLabel}>
                      {unitType || 'Units'}
                    </Text>
                  </View>
                  {isError && <Text style={styles.errorText}>Invalid (Current &lt; Prev)</Text>}
                </View>
              </View>
            );
          })}

          {totalFloorPagesUnits > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                disabled={currentPage === 1}
                onPress={() => setPage(currentPage - 1)}
              >
                <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? theme.Colors.onSurfaceVariant : theme.Colors.primary} />
                <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Prev</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageInfoText}>
                Page {currentPage} of {totalFloorPagesUnits}
              </Text>
              
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === totalFloorPagesUnits && styles.pageButtonDisabled]}
                disabled={currentPage === totalFloorPagesUnits}
                onPress={() => setPage(currentPage + 1)}
              >
                <Text style={[styles.pageButtonText, currentPage === totalFloorPagesUnits && styles.pageButtonTextDisabled]}>Next</Text>
                <MaterialIcons name="chevron-right" size={20} color={currentPage === totalFloorPagesUnits ? theme.Colors.onSurfaceVariant : theme.Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  floorCard: {
    borderRadius: 16,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: theme.Spacing.md,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  floorHeaderText: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  rowError: {
    backgroundColor: withAlpha(theme.Colors.error, 0.04),
  },
  rowLeft: {
    flex: 1.5,
  },
  unitName: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  tenantName: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  prevReading: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: theme.Spacing.xs,
  },
  prevTextInput: {
    borderWidth: 1,
    borderColor: isDark ? withAlpha(theme.Colors.primary, 0.25) : withAlpha(theme.Colors.primary, 0.2),
    backgroundColor: isDark ? theme.Colors.surfaceContainerLowest : theme.Colors.surfaceContainerLowest,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: theme.Typography.bodySmall.fontSize,
    width: 70,
    color: theme.Colors.onSurface,
    fontWeight: '600',
  },
  rowMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  costText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: theme.Spacing.xs,
  },
  rowRight: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: isDark ? withAlpha(theme.Colors.onSurface, 0.15) : withAlpha(theme.Colors.primary, 0.15),
    paddingHorizontal: 12,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '600',
    textAlign: 'right',
  },
  inputError: {
    borderColor: theme.Colors.error,
    backgroundColor: withAlpha(theme.Colors.error, 0.05),
  },
  unitTypeLabel: {
    marginLeft: 6,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  errorText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.error,
    fontWeight: '600',
    marginTop: theme.Spacing.xs,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.Spacing.md,
    backgroundColor: isDark ? 'transparent' : withAlpha(theme.Colors.primary, 0.02),
    borderTopWidth: 1,
    borderTopColor: (isDark ? withAlpha(theme.Colors.onSurface, 0.08) : withAlpha(theme.Colors.primary, 0.04)),
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: theme.Spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: isDark ? theme.Colors.surfaceContainerLowest : theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
  },
  pageButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'transparent',
    borderColor: isDark ? withAlpha(theme.Colors.onSurface, 0.05) : withAlpha(theme.Colors.onSurface, 0.05),
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
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
});
