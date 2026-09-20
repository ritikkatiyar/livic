import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Alert, 
  TextInput 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { formatErrorMessage } from '@/src/utils/errors';
import { getProperty } from '@/src/features/properties/api/property.api';
import { getBlocks } from '@/src/features/properties/api/block.api';
import { getFloorSummaries, FloorSummaryResponse, generateBatchUnits } from '@/src/features/properties/api/unit.api';
import { useFocusEffect } from 'expo-router';

import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { createStyles } from './FloorListOverviewScreen.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface FloorListOverviewScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onEditFloor: (floorNumber: number) => void;
  /** The building these floors belong to. Omitted means the property's only block. */
  blockId?: string | null;
  /** Shown beside the property name once a property has more than one building. */
  blockName?: string | null;
  /** How tall this block is, when the caller already knows. */
  blockTotalFloors?: number | null;
}

export default function FloorListOverviewScreen({ 
  propertyId, 
  userToken, 
  onBack,
  onEditFloor,
  blockId,
  blockName,
  blockTotalFloors
}: FloorListOverviewScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();

  const [propertyName, setPropertyName] = useState('Loading...');
  const [floors, setFloors] = useState<FloorSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalFloorsFromProperty, setTotalFloorsFromProperty] = useState<number | undefined>(undefined);
  const [quickCounts, setQuickCounts] = useState<Record<number, string>>({});
  const [quickUnitTypes, setQuickUnitTypes] = useState<Record<number, string>>({});
  const [generatingFloor, setGeneratingFloor] = useState<number | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [property, allBlocks] = await Promise.all([
        getProperty(propertyId, userToken),
        blockId ? getBlocks(propertyId, userToken) : Promise.resolve([]),
      ]);

      let resolvedBlockName = blockName;
      let resolvedFloorCount = blockTotalFloors;

      if (blockId && (!resolvedBlockName || resolvedFloorCount === undefined || resolvedFloorCount === null)) {
        const currentBlock = allBlocks.find((b) => b.id === blockId);
        if (currentBlock) {
          resolvedBlockName = currentBlock.name;
          resolvedFloorCount = currentBlock.totalFloors ?? undefined;
        }
      }

      setPropertyName(resolvedBlockName ? `${property.name} · ${resolvedBlockName}` : property.name);
      const floorCount = resolvedFloorCount ?? (blockId ? undefined : property.totalFloors);
      setTotalFloorsFromProperty(floorCount);

      const floorData = await getFloorSummaries(propertyId, userToken, floorCount, blockId);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [propertyId, userToken, blockId, blockName, blockTotalFloors]);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const floorData = await getFloorSummaries(propertyId, userToken, totalFloorsFromProperty, blockId);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickCountChange = (floorNum: number, value: string) => {
    setQuickCounts(prev => ({
      ...prev,
      [floorNum]: value
    }));
  };

  const handleQuickUnitTypeChange = (floorNum: number, value: string) => {
    setQuickUnitTypes(prev => ({
      ...prev,
      [floorNum]: value
    }));
  };

  const handleQuickGenerate = async (floorNum: number) => {
    const countStr = quickCounts[floorNum];
    if (!countStr || parseInt(countStr, 10) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of units.');
      return;
    }

    const count = parseInt(countStr, 10);
    const unitType = quickUnitTypes[floorNum] || 'SINGLE_UNIT';
    setGeneratingFloor(floorNum);

    try {
      await generateBatchUnits(propertyId, {
        totalFloors: 1,
        unitsPerFloor: count,
        startingFloorNumber: floorNum,
        prefix: '',
        capacity: 1,
        unitType: unitType,
        blockId: blockId ?? null
      }, userToken);

      Alert.alert('Success', `Successfully created ${count} units on Floor ${floorNum}`);
      setQuickCounts(prev => ({
        ...prev,
        [floorNum]: ''
      }));
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate units.');
    } finally {
      setGeneratingFloor(null);
    }
  };

  const renderFloorCard = (floor: FloorSummaryResponse) => (
    <View 
      key={floor.floorNumber} 
      style={[
        styles.floorCard, 
        isDesktop && styles.floorCardDesktop
      ]}
    >
      <View style={styles.floorCardHeader}>
        <View style={styles.floorNumberBox}>
          <Text style={styles.floorNumberText}>{floor.floorNumber}</Text>
        </View>
        <View style={styles.floorInfo}>
          <Text style={styles.floorTitle}>
            Floor {floor.floorNumber} {floor.floorNumber === 1 ? '(Ground)' : ''}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, floor.configured ? styles.statusConfigured : styles.statusNotConfigured]}>
              <MaterialIcons 
                name={floor.configured ? "check-circle" : "warning"} 
                size={12} 
                color={floor.configured ? theme.Colors.success : theme.Colors.error} 
              />
              <Text style={[styles.statusText, floor.configured ? styles.textConfigured : styles.textNotConfigured]}>
                {floor.configured ? 'Configured' : 'Not Configured'}
              </Text>
            </View>
            <Text style={styles.unitCountText}>{floor.unitCount} Units</Text>
          </View>
        </View>
      </View>

      <ActionButton
        variant="primary"
        label={floor.configured ? "Edit Layout" : "Draw Layout (Visual Editor)"}
        icon={floor.configured ? "edit" : "gesture"}
        onPress={() => onEditFloor(floor.floorNumber)}
        fullWidth
      />

      {!floor.configured && (
        <View style={styles.quickCreateSection}>
          <Text style={styles.quickCreateTitle}>Quick Create Units</Text>
          <View style={styles.quickCreateRow}>
            <View style={{ width: '30%' }}>
              <TextInput
                style={styles.quickCreateInput}
                placeholder="#"
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                keyboardType="numeric"
                maxLength={2}
                value={quickCounts[floor.floorNumber] || ''}
                onChangeText={(val) => handleQuickCountChange(floor.floorNumber, val.replace(/[^0-9]/g, ''))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GlassDropdown
                options={UNIT_TYPE_OPTIONS}
                value={quickUnitTypes[floor.floorNumber] || 'SINGLE_UNIT'}
                onChange={(val) => handleQuickUnitTypeChange(floor.floorNumber, val)}
                placeholder="Unit Type"
                icon="home"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.quickGenerateButton, { marginTop: 12 }]}
            onPress={() => handleQuickGenerate(floor.floorNumber)}
            disabled={generatingFloor === floor.floorNumber}
            activeOpacity={0.8}
          >
            {generatingFloor === floor.floorNumber ? (
              <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
            ) : (
              <>
                <Text style={styles.quickGenerateButtonText}>Generate</Text>
                <MaterialIcons name="flash-on" size={16} color={theme.Colors.surfaceContainerLowest} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isDesktop) {
    return (
      <PageShell scrollable={true}>
        <View style={styles.desktopInner}>
          {/* Full Width Header Row */}
          <View style={styles.desktopHeaderRow}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButtonBadge}
              activeOpacity={0.75}
            >
              <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.titleLineDesktop}>Floor Overview</Text>
                <View style={styles.propertyBadge}>
                  <View style={styles.propertyIconWrapper}>
                    <MaterialIcons name="business" size={14} color={theme.Colors.surfaceContainerLowest} />
                  </View>
                  <Text style={styles.propertyNameLabel}>{propertyName}</Text>
                </View>
              </View>
              <Text style={styles.subtitleDesktop}>Manage structural floor plans and unit layouts</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.floorsGridDesktop}>
              {floors.map(renderFloorCard)}
            </View>
          )}
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell 
      scrollable={true}
      header={
        <View style={styles.headerContent}>
          <View style={styles.titleWrapper}>
            <Text style={styles.compactTitleText}>Floor Overview</Text>
          </View>
        </View>
      }
    >
      <View style={styles.largeTitleContainer}>
        <Text style={styles.titleLine}>Floor Overview</Text>
        <View style={styles.propertyBadge}>
          <View style={styles.propertyIconWrapper}>
            <MaterialIcons name="business" size={14} color={theme.Colors.surfaceContainerLowest} />
          </View>
          <Text style={styles.propertyNameLabel}>{propertyName}</Text>
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.floorsList}>
          {floors.map(renderFloorCard)}
        </View>
      )}
    </PageShell>
  );
}
