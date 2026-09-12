import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef } from 'react';
import { 
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';

import { useMeterReading } from '@/src/features/finance/hooks/useMeterReading';
import { MeterReadingSummary } from '@/src/features/finance/components/MeterReadingSummary';
import { MeterReadingFloorCard } from '@/src/features/finance/components/MeterReadingFloorCard';
import { createStyles } from './MeterReadingScreen.styles';

export default function MeterReadingScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { id: paramPropertyId, propertyId: paramPropertyIdAlt } = useLocalSearchParams<{ id?: string; propertyId?: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const rawParam = paramPropertyId || paramPropertyIdAlt;
  const validParamId = (rawParam && rawParam !== 'null' && rawParam !== 'undefined') ? rawParam : null;
  const propertyId = selectedPropertyId || validParamId || null;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScrollNav();

  const {
    isLoading,
    isSaving,
    configs,
    selectedConfigId,
    setSelectedConfigId,
    month,
    year,
    worksheet,
    inputs,
    setInputs,
    prevInputs,
    setPrevInputs,
    inputRefs,
    expandedFloors,
    setExpandedFloors,
    floorPages,
    setFloorPages,
    floorPage,
    setFloorPage,
    toggleFloor,
    handleSave,
    changeMonth,
  } = useMeterReading({ token, propertyId: propertyId as string });

  const getMonthName = (m: number) => {
    const date = new Date();
    date.setMonth(m - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const selectedConfig = configs.find(c => c.id === selectedConfigId);
  const baseRate = selectedConfig?.baseRate || 0;

  const groupedWorksheet = worksheet.reduce((acc, row) => {
    const floor = row.floor ?? 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(row);
    return acc;
  }, {} as Record<number, typeof worksheet>);

  const sortedFloors = Object.keys(groupedWorksheet).map(Number).sort((a, b) => a - b);
  const floorsPerPage = 4;
  const totalFloorPages = Math.ceil(sortedFloors.length / floorsPerPage);
  const startFloorIndex = (floorPage - 1) * floorsPerPage;
  const paginatedFloors = sortedFloors.slice(startFloorIndex, startFloorIndex + floorsPerPage);

  const totalUnits = worksheet.length;
  const readingsEntered = worksheet.filter(row => inputs[row.unitId] && inputs[row.unitId].trim() !== '').length;

  let totalConsumption = 0;
  let totalEstimatedCost = 0;

  worksheet.forEach(row => {
    const valStr = inputs[row.unitId];
    const prevStr = prevInputs[row.unitId];
    const prevVal = prevStr !== undefined && prevStr !== '' ? parseFloat(prevStr) : (row.previousReading ?? 0);
    if (valStr && valStr.trim() !== '') {
      const val = parseFloat(valStr);
      if (!isNaN(val) && !isNaN(prevVal) && val >= prevVal) {
        const consumed = val - prevVal;
        totalConsumption += consumed;
        totalEstimatedCost += consumed * baseRate;
      }
    }
  });

  const renderDesktopShell = () => (
    <View style={styles.desktopShell}>
      <View style={styles.desktopMain}>

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            {/* Header Row */}
            <View style={styles.desktopHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => router.push('/expenses')}
                  style={{ marginRight: 14, padding: 8, borderRadius: 12, backgroundColor: theme.Colors.glassFill, borderWidth: 1, borderColor: theme.Colors.glassStroke }}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
                </TouchableOpacity>
                <View style={styles.largeTitleContainer}>
                  <Text style={styles.titleLineDesktop}>Meter Readings</Text>
                </View>
              </View>

              {/* Action Save Button */}
              <TouchableOpacity 
                style={[styles.desktopSaveButton, (isSaving || worksheet.length === 0) && { opacity: 0.5 }]} 
                onPress={handleSave}
                disabled={isSaving || worksheet.length === 0}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} size="small" />
                ) : (
                  <>
                    <Text style={styles.desktopSaveButtonText}>SAVE READINGS</Text>
                    <MaterialIcons name="check" size={18} color={theme.Colors.surfaceContainerLowest} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Filter Section Row */}
            <View style={styles.desktopFilterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabelCaps}>Utility Configuration</Text>
                <GlassDropdown 
                  options={configs.map(c => ({ label: c.chargeName, value: c.id }))}
                  value={selectedConfigId}
                  onChange={setSelectedConfigId}
                  placeholder="Select Utility"
                  icon="receipt-long"
                />
              </View>
              
              <View style={{ width: 300 }}>
                <Text style={styles.filterLabelCaps}>Billing Period</Text>
                <View style={styles.desktopMonthSelector}>
                  <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
                    <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>{getMonthName(month)} {year}</Text>
                  <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
                    <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Main Content Grid */}
            {!propertyId ? (
              <PropertyRequiredBanner
                title="Select Property for Meter Readings"
                description="Utility meters and consumptions are tracked per property. Select a property to enter unit readings."
                icon="speed"
                properties={properties}
                selectedPropertyId={propertyId}
                onSelectProperty={setSelectedPropertyId}
              />
            ) : isLoading ? (
              <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 80 }} />
            ) : worksheet.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <MaterialIcons name="receipt-long" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>No metered units found for this configuration.</Text>
              </View>
            ) : (
              <View style={styles.desktopGrid}>
                {/* Left Column: Floor Cards */}
                <View style={styles.desktopLeftColumn}>
                  {worksheet.length > 0 && (
                    <View style={styles.listControlsRow}>
                      <TouchableOpacity 
                        style={styles.controlLink}
                        onPress={() => {
                          const allExpanded: Record<number, boolean> = {};
                          sortedFloors.forEach(f => allExpanded[f] = true);
                          setExpandedFloors(allExpanded);
                        }}
                      >
                        <MaterialIcons name="unfold-more" size={16} color={theme.Colors.primary} />
                        <Text style={styles.controlLinkText}>EXPAND ALL</Text>
                      </TouchableOpacity>
                      <View style={styles.controlSeparator} />
                      <TouchableOpacity 
                        style={styles.controlLink}
                        onPress={() => {
                          setExpandedFloors({});
                        }}
                      >
                        <MaterialIcons name="unfold-less" size={16} color={theme.Colors.primary} />
                        <Text style={styles.controlLinkText}>COLLAPSE ALL</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {paginatedFloors.map(floor => {
                    const isExpanded = expandedFloors[floor];
                    return (
                      <MeterReadingFloorCard
                        key={`floor-${floor}`}
                        floor={floor}
                        isExpanded={isExpanded}
                        toggleFloor={() => toggleFloor(floor)}
                        floorUnits={groupedWorksheet[floor] || []}
                        currentPage={floorPages[floor] || 1}
                        setPage={(p) => setFloorPages(prev => ({ ...prev, [floor]: p }))}
                        inputs={inputs}
                        setInputs={setInputs}
                        prevInputs={prevInputs}
                        setPrevInputs={setPrevInputs}
                        inputRefs={inputRefs}
                        baseRate={baseRate}
                        unitType={selectedConfig?.unitType}
                      />
                    );
                  })}

                  {totalFloorPages > 1 && (
                    <View style={styles.paginationRow}>
                      <TouchableOpacity 
                        style={[styles.pageButton, floorPage === 1 && styles.pageButtonDisabled]}
                        disabled={floorPage === 1}
                        onPress={() => setFloorPage(prev => Math.max(1, prev - 1))}
                      >
                        <MaterialIcons name="chevron-left" size={20} color={floorPage === 1 ? '#a0aab2' : theme.Colors.primary} />
                        <Text style={[styles.pageButtonText, floorPage === 1 && styles.pageButtonTextDisabled]}>Prev Floors</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.pageInfoText}>
                        Page {floorPage} of {totalFloorPages}
                      </Text>
                      
                      <TouchableOpacity 
                        style={[styles.pageButton, floorPage === totalFloorPages && styles.pageButtonDisabled]}
                        disabled={floorPage === totalFloorPages}
                        onPress={() => setFloorPage(prev => Math.min(totalFloorPages, prev + 1))}
                      >
                        <Text style={[styles.pageButtonText, floorPage === totalFloorPages && styles.pageButtonTextDisabled]}>Next Floors</Text>
                        <MaterialIcons name="chevron-right" size={20} color={floorPage === totalFloorPages ? '#a0aab2' : theme.Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Right Column: Dashboard Summary Panel */}
                <View style={styles.desktopRightColumn}>
                  <MeterReadingSummary
                    totalUnits={totalUnits}
                    readingsEntered={readingsEntered}
                    selectedConfigName={selectedConfig?.chargeName}
                    unitType={selectedConfig?.unitType}
                    baseRate={baseRate}
                    billingMonthName={getMonthName(month)}
                    billingYear={year}
                    totalConsumption={totalConsumption}
                    totalEstimatedCost={totalEstimatedCost}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderMobileShell = () => (
    <View style={styles.gradient}>
        {/* Filters */}
        <View style={[styles.filterSection, { paddingTop: 64 }]}>
          <GlassDropdown 
            options={configs.map(c => ({ label: c.chargeName, value: c.id }))}
            value={selectedConfigId}
            onChange={setSelectedConfigId}
            placeholder="Select Utility"
            icon="receipt-long"
          />
          
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
              <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{getMonthName(month)} {year}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
              <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {(!properties || properties.length === 0) ? (
            <View style={{ padding: 32, borderRadius: 16, alignItems: 'center', maxWidth: 500, alignSelf: 'center', marginTop: 40, width: '100%', backgroundColor: theme.Colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.Colors.outline }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.Colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <MaterialIcons name="business" size={32} color={theme.Colors.primary} />
              </View>
              <Text style={{ fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface, marginBottom: 8, textAlign: 'center' }}>No Property Created Yet</Text>
              <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Logging meter readings requires an active property. Create your first property to start inputting meter logs.
              </Text>
              <TouchableOpacity 
                style={{ borderRadius: 10 }}
                onPress={() => router.push('/properties/create')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8, backgroundColor: theme.Colors.primary, borderRadius: 10 }}>
                  <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', letterSpacing: 1 }}>CREATE FIRST PROPERTY</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 50 }} />
          ) : worksheet.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No metered units found for this configuration.</Text>
            </View>
          ) : (
            <>
              <View style={styles.listControlsRowMobile}>
                <TouchableOpacity 
                  style={styles.controlLink}
                  onPress={() => {
                    const allExpanded: Record<number, boolean> = {};
                    sortedFloors.forEach(f => allExpanded[f] = true);
                    setExpandedFloors(allExpanded);
                  }}
                >
                  <MaterialIcons name="unfold-more" size={16} color={theme.Colors.primary} />
                  <Text style={styles.controlLinkText}>EXPAND ALL</Text>
                </TouchableOpacity>
                <View style={styles.controlSeparator} />
                <TouchableOpacity 
                  style={styles.controlLink}
                  onPress={() => {
                    setExpandedFloors({});
                  }}
                >
                  <MaterialIcons name="unfold-less" size={16} color={theme.Colors.primary} />
                  <Text style={styles.controlLinkText}>COLLAPSE ALL</Text>
                </TouchableOpacity>
              </View>

              {sortedFloors.map(floor => {
                const isExpanded = expandedFloors[floor];
                return (
                  <MeterReadingFloorCard
                    key={`floor-${floor}`}
                    floor={floor}
                    isExpanded={isExpanded}
                    toggleFloor={() => toggleFloor(floor)}
                    floorUnits={groupedWorksheet[floor] || []}
                    currentPage={floorPages[floor] || 1}
                    setPage={(p) => setFloorPages(prev => ({ ...prev, [floor]: p }))}
                    inputs={inputs}
                    setInputs={setInputs}
                    prevInputs={prevInputs}
                    setPrevInputs={setPrevInputs}
                    inputRefs={inputRefs}
                    baseRate={baseRate}
                    unitType={selectedConfig?.unitType}
                  />
                );
              })}
            </>
          )}
          <View style={{ height: 120 }} />
        </Animated.ScrollView>

        {/* Floating Save Button */}
        <View style={styles.floatingSaveBar}>
          <TouchableOpacity
            style={[styles.floatingSaveBtn, (isSaving || worksheet.length === 0) && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={isSaving || worksheet.length === 0}
            activeOpacity={0.85}
          >
            <View style={styles.floatingSaveBtnInner}>
              {isSaving ? (
                <ActivityIndicator color={theme.Colors.surfaceContainerLowest} size="small" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.floatingSaveText}>SAVE READINGS</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <PageShell scrollable={false} keyboardAvoiding edges={isDesktop ? ['top'] : []}>
      {isDesktop ? renderDesktopShell() : renderMobileShell()}
    </PageShell>
  );
}
