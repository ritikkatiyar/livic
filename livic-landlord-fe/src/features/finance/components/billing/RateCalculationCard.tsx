import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface RateCalculationCardProps {
  calcMethod: string;
  setCalcMethod: (val: string) => void;
  baseRate: string;
  setBaseRate: (val: string) => void;
  unitType: string;
  setUnitType: (val: string) => void;
  isDesktop: boolean;
  isDark: boolean;
}

export function RateCalculationCard({
  calcMethod,
  setCalcMethod,
  baseRate,
  setBaseRate,
  unitType,
  setUnitType,
  isDesktop,
  isDark,
}: RateCalculationCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const unitScrollRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<any>(null);

  const units = ['kWh', 'Liters', 'kL', 'Units', 'SqFt', 'Gallons'];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calculator-variant-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Rate & Calculation</Text>
      </View>

      <Text style={styles.label}>CALCULATION METHOD</Text>
      
      <View style={styles.radioGroup}>
        {[
          { title: 'Fixed Rate', sub: 'Standard monthly fee' },
          { title: 'Metered/Consumption', sub: 'Based on usage units' }
        ].map((method, index) => {
          const isActive = calcMethod === method.title;
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.radioRow}
              onPress={() => setCalcMethod(method.title)}
            >
              <View style={[styles.radioCircle, isActive ? styles.radioCircleActive : styles.radioCircleInactive]}>
                {isActive && <View style={styles.radioDot} />}
              </View>
              <View>
                <Text style={styles.radioTitle}>{method.title}</Text>
                <Text style={styles.radioSub}>{method.sub}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {calcMethod === 'Fixed Rate' ? (
        <>
          <Text style={styles.label}>BASE RATE</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput 
              style={styles.inputWithIcon} 
              placeholder="0.00" 
              placeholderTextColor={theme.Colors.outlineVariant}
              keyboardType="numeric"
              value={baseRate}
              onChangeText={setBaseRate}
            />
          </View>
        </>
      ) : (
        <View>
          <Text style={styles.label}>RATE PER UNIT / TYPE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.inputContainer, styles.rateInputContainer]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={styles.inputWithIcon} 
                placeholder="0.00" 
                placeholderTextColor={theme.Colors.outlineVariant}
                keyboardType="numeric"
                value={baseRate}
                onChangeText={setBaseRate}
              />
            </View>
            
            {isDesktop ? (
              <View style={styles.desktopUnits}>
                {units.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitBtn,
                      unitType === unit && (isDark ? styles.unitBtnActiveDark : styles.unitBtnActiveLight),
                    ]}
                    onPress={() => setUnitType(unit)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.unitText,
                      unitType === unit && (isDark ? styles.unitTextActiveDark : styles.unitTextActiveLight),
                    ]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.mobileUnitsScrollWrapper}>
                <ScrollView 
                  ref={unitScrollRef}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  snapToInterval={40}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: 25 }}
                  scrollEventThrottle={16}
                  onScroll={(e) => {
                    if (Platform.OS === 'web') {
                      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
                      const y = e.nativeEvent.contentOffset.y;
                      scrollTimeout.current = setTimeout(() => {
                        const index = Math.max(0, Math.round(y / 40));
                        if(units[index]) {
                          setUnitType(units[index]);
                          unitScrollRef.current?.scrollTo({ y: index * 40, animated: true });
                        }
                      }, 150);
                    }
                  }}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                    if(units[index]) setUnitType(units[index]);
                  }}
                >
                  {units.map((unit, index) => {
                    const isActive = unitType === unit;
                    return (
                      <TouchableOpacity 
                        key={unit} 
                        style={styles.scrollItem}
                        onPress={() => {
                          setUnitType(unit);
                          unitScrollRef.current?.scrollTo({ y: index * 40, animated: true });
                        }}
                      >
                        <Text style={[
                          styles.scrollText,
                          isActive && { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '700', color: theme.Colors.primary },
                        ]}>{unit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean = false) => StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  label: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: theme.Spacing.sm,
  },
  radioGroup: {
    marginBottom: theme.Spacing.lg,
    gap: theme.Spacing.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: theme.Colors.primary,
  },
  radioCircleInactive: {
    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : theme.Colors.outlineVariant,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary,
  },
  radioTitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  radioSub: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  inputContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.Colors.glassStroke,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : theme.Colors.glassFill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    marginBottom: 20,
  },
  rateInputContainer: {
    flex: 1,
    marginBottom: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  currencySymbol: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
    marginRight: theme.Spacing.sm,
  },
  inputWithIcon: {
    flex: 1,
    height: '100%',
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  desktopUnits: {
    flex: 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginLeft: theme.Spacing.md,
  },
  unitBtn: {
    paddingVertical: theme.Spacing.sm,
    paddingHorizontal: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : theme.Colors.glassFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.Colors.glassStroke,
  },
  unitBtnActiveDark: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.Colors.primary,
  },
  unitBtnActiveLight: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  unitText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  unitTextActiveDark: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  unitTextActiveLight: {
    color: theme.Colors.onPrimary,
    fontWeight: '600',
  },
  mobileUnitsScrollWrapper: {
    width: 100,
    height: 90,
    position: 'relative',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.Colors.glassStroke,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : theme.Colors.glassFill,
  },
  scrollItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scrollText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '500',
    color: 'rgba(132, 148, 149, 0.4)',
  },
});
