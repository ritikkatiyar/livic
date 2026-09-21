import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useBillingWorksheet } from '@/src/features/finance/hooks/useBillingWorksheet';
import { formatErrorMessage } from '@/src/utils/errors';
import { createStyles } from './BillingWorksheetScreen.styles';
import { SkeletonRow } from '@/src/components/common/feedback/Skeleton';

import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';
import { BlockFilterPills } from '@/src/components/common/inputs/BlockFilterPills';

// Sub-components
import { WorksheetFloorList } from '../components/billing/WorksheetFloorList';

export default function BillingWorksheetScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { selectedPropertyId, setSelectedPropertyId, selectedBlockId, setSelectedBlockId } = useGlobalPropertySelection();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const validParamId = (paramPropertyId && paramPropertyId !== 'null' && paramPropertyId !== 'undefined') ? paramPropertyId : null;
  const propertyId = selectedPropertyId || validParamId || null;
  
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // React-Query Custom Hook
  const {
    charges,
    entries,
    isLoading,
    isSaving,
    saveWorksheet,
  } = useBillingWorksheet(propertyId, selectedChargeId, billingMonth, token, selectedBlockId);

  useEffect(() => {
    if (charges.length > 0 && !selectedChargeId) {
      const rentCharge = charges.find(c => c.chargeCategory === 'RENT');
      setSelectedChargeId(rentCharge ? rentCharge.id : charges[0].id);
    }
  }, [charges]);

  useEffect(() => {
    if (entries.length > 0) {
      const initialValues: Record<string, string> = {};
      entries.forEach(entry => {
        initialValues[entry.unitId] = entry.enteredValue !== null && entry.enteredValue !== undefined 
          ? entry.enteredValue.toString() 
          : '';
      });
      setEditValues(initialValues);
    }
  }, [entries]);

  const handleSave = async () => {
    if (!token || !propertyId || !selectedChargeId) return;
    try {
      const payloadEntries = Object.entries(editValues).map(([unitId, val]) => ({
        unitId,
        enteredValue: val ? parseFloat(val) : 0
      }));
      
      await saveWorksheet(payloadEntries);
      Alert.alert("Success", "Worksheet saved successfully!");
    } catch (error: any) {
      Alert.alert("Error", formatErrorMessage(error));
    }
  };

  const selectedCharge = charges.find(c => c.id === selectedChargeId);

  const renderContent = () => {
    if (!propertyId) {
      return (
        <PropertyRequiredBanner
          title="Select Property for Billing Worksheet"
          description="Billing worksheets calculate tenant utilities and consumption per building. Select a property to continue."
          icon="description"
          properties={properties}
          selectedPropertyId={propertyId}
          onSelectProperty={setSelectedPropertyId}
        />
      );
    }
    if (!properties || properties.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <MaterialIcons name="business" size={48} color={theme.Colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { fontWeight: '600', color: theme.Colors.onSurface, fontSize: theme.Typography.bodyLg.fontSize, marginBottom: 8 }]}>No Property Created Yet</Text>
          <Text style={[styles.emptyText, { textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 }]}>
            Billing worksheets require an active property. Create your first property to start managing worksheets.
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: theme.Colors.primary, borderRadius: theme.Rounded.lg, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() => router.push('/properties/create')}
          >
            <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
            <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700' }}>Create First Property</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading && charges.length === 0) {
      return (
        <View style={{ padding: 40, gap: 16 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      );
    }

    if (charges.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <MaterialIcons name="receipt-long" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No active charges configured for this property.</Text>
        </View>
      );
    }

    if (entries.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <MaterialIcons name="domain-disabled" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { textAlign: 'center', paddingHorizontal: 40 }]}>
            No occupied units with active leases found for this property. Assign a tenant first to view billing worksheets.
          </Text>
        </View>
      );
    }

    return (
      <WorksheetFloorList
        entries={entries}
        editValues={editValues}
        setEditValues={setEditValues}
        selectedCharge={selectedCharge}
        propertyId={propertyId}
      />
    );
  };

  const renderDesktopShell = () => (
    <View style={[styles.desktopShell, { flex: 1 }]}>
      <View style={styles.desktopMain}>


        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
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
                  <Text style={styles.titleLineDesktop}>Billing Worksheets</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.desktopSaveButton, (isSaving || entries.length === 0) && { opacity: 0.5 }]} 
                onPress={handleSave}
                disabled={isSaving || entries.length === 0}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} size="small" />
                ) : (
                  <>
                    <Text style={styles.desktopSaveButtonText}>SAVE MAPPINGS</Text>
                    <MaterialIcons name="check" size={18} color={theme.Colors.surfaceContainerLowest} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Multi-Block Filter Pills */}
            <BlockFilterPills
              propertyId={propertyId}
              selectedBlockId={selectedBlockId}
              onSelectBlockId={setSelectedBlockId}
            />

            <View style={styles.desktopFilterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabelCaps}>Charge Configuration</Text>
                <GlassDropdown 
                  options={charges.map(c => ({ label: c.chargeName, value: c.id }))}
                  value={selectedChargeId}
                  onChange={setSelectedChargeId}
                  placeholder="Select Charge"
                  icon="receipt-long"
                />
              </View>
              
              <View style={{ width: 250 }}>
                <Text style={styles.filterLabelCaps}>Billing Month</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.monthAdjustButton}>
                    <MaterialIcons name="chevron-left" size={20} color={theme.Colors.primary} />
                  </TouchableOpacity>
                  
                  <View style={[styles.monthBadge, { flex: 1, marginTop: 0 }]}>
                    <MaterialIcons name="calendar-today" size={16} color={theme.Colors.primary} />
                    <Text style={styles.monthBadgeText}>{billingMonth}</Text>
                  </View>
                  
                  <TouchableOpacity onPress={handleNextMonth} style={styles.monthAdjustButton}>
                    <MaterialIcons name="chevron-right" size={20} color={theme.Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {renderContent()}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderMobileShell = () => (
    <View style={[styles.gradient, { flex: 1 }]}>
      <View style={[styles.filterSection, { paddingTop: 68 + insets.top }]}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface, letterSpacing: -0.3 }}>
            Billing Worksheets
          </Text>
        </View>

        {/* Multi-Block Filter Pills */}
        <BlockFilterPills
          propertyId={propertyId}
          selectedBlockId={selectedBlockId}
          onSelectBlockId={setSelectedBlockId}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.mobileDropdownWrapper, { flex: 1, marginBottom: 0 }]}>
            <GlassDropdown 
              options={charges.map(c => ({ label: c.chargeName, value: c.id }))}
              value={selectedChargeId}
              onChange={setSelectedChargeId}
              placeholder="Select Charge"
              icon="receipt-long"
            />
          </View>
          <TouchableOpacity 
            style={[styles.headerGradientInner, (isSaving || entries.length === 0) && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={isSaving || entries.length === 0}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
            ) : (
              <>
                <MaterialIcons name="check" size={15} color={theme.Colors.surfaceContainerLowest} />
                <Text style={styles.headerGradientText}>SAVE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.monthSelectorRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthAdjustButton}>
            <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.monthBadge}>
            <MaterialIcons name="calendar-today" size={16} color={theme.Colors.primary} />
            <Text style={styles.monthBadgeText}>{billingMonth}</Text>
          </View>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthAdjustButton}>
            <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );

  return (
    <PageShell 
      scrollable={false}
      keyboardAvoiding={true}
      edges={isDesktop ? ['top'] : []}
    >
      {isDesktop ? renderDesktopShell() : renderMobileShell()}
    </PageShell>
  );
}
