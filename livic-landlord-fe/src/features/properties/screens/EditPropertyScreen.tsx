import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PageShell } from '@/src/components/common/layout/PageShell';
import Building3DView from '@/src/features/properties/components/Building3DView';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useEditProperty } from '@/src/features/properties/hooks/useEditProperty';
import { MediaUploadGrid } from '@/src/components/common/display/MediaUploadGrid';
import { createStyles } from './EditPropertyScreen.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

const BILLING_DAY_OPTIONS = [
  { label: 'Disabled (Manual Invoicing Only)', value: '' },
  ...Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const suffix = day === 1 ? 'st of month (Default)' : day === 2 ? 'nd of month' : day === 3 ? 'rd of month' : day === 15 ? 'th (Mid-month)' : day === 31 ? 'st (Month-end)' : 'th of month';
    return { label: `Day ${day} (${day}${suffix})`, value: String(day) };
  }),
];

const PRESET_BILLING_DAYS = [
  { label: '1st (Default)', value: '1' },
  { label: '5th', value: '5' },
  { label: '10th', value: '10' },
  { label: '15th', value: '15' },
  { label: '25th', value: '25' },
  { label: 'Disabled', value: '' },
];

interface EditPropertyScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
  onConfigureFloors: () => void;
}

export default function EditPropertyScreen({
  propertyId,
  userToken,
  onBack,
  onSave,
  onConfigureFloors,
}: EditPropertyScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();

  const {
    name,
    setName,
    address,
    setAddress,
    city,
    setCity,
    landmark,
    setLandmark,
    totalFloors,
    setTotalFloors,
    autoBillDayOfMonth,
    setAutoBillDayOfMonth,
    globalUnitsPerFloor,
    setGlobalUnitsPerFloor,
    globalUnitType,
    setGlobalUnitType,
    selectedAmenities,
    toggleAmenity,
    loading,
    saving,
    hasConfiguredFloor,
    hasMultipleBlocks,
    totalBlocks,
    handleUpdate,
  } = useEditProperty({ propertyId, userToken, onBack, onSave });

  const router = useRouter();

  const [resetRotationTrigger, setResetRotationTrigger] = useState(0);
  const unitTypeDropdownRefDesktop = useRef<any>(null);
  const unitTypeDropdownRefMobile = useRef<any>(null);

  React.useEffect(() => {
    if (globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0) {
      const timer = setTimeout(() => {
        if (isDesktop) {
          unitTypeDropdownRefDesktop.current?.open();
        } else {
          unitTypeDropdownRefMobile.current?.open();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [globalUnitsPerFloor, isDesktop]);

  const renderFormFieldsContent = (showSave = true) => (
    <>
      <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PROPERTY NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lumina Heights"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="Street address"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>CITY</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. New York"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>LANDMARK (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Near Central Park"
          value={landmark}
          onChangeText={setLandmark}
        />
      </View>

      {hasMultipleBlocks ? (
        <View style={styles.multiBlockNoticeCard}>
          <View style={styles.multiBlockNoticeIconWrapper}>
            <MaterialIcons name="domain" size={24} color={theme.Colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.multiBlockNoticeTitle}>
              Floors & Units are managed per Block ({totalBlocks} Blocks configured)
            </Text>
            <Text style={styles.multiBlockNoticeSubtitle}>
              Each block has its own physical floor count and layout. Configure them in Blocks & Floors.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.multiBlockManageButton}
            onPress={() => router.push(`/properties/${propertyId}/blocks`)}
            activeOpacity={0.8}
          >
            <Text style={styles.multiBlockManageButtonText}>Manage Blocks</Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.Colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.row, !isDesktop && { flexDirection: 'column', gap: 0 }]}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>TOTAL FLOORS</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="0"
                value={totalFloors}
                onChangeText={(val) => setTotalFloors(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
              <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIcon} />
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>GLOBAL UNITS/FLOOR</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.inputWithIcon,
                  hasConfiguredFloor && { opacity: 0.5, backgroundColor: 'rgba(230, 230, 230, 0.3)' },
                ]}
                placeholder={hasConfiguredFloor ? 'Disabled (Units exist)' : 'Optional'}
                value={globalUnitsPerFloor}
                onChangeText={(val) => setGlobalUnitsPerFloor(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                editable={!hasConfiguredFloor}
              />
              <MaterialIcons name="grid-on" size={20} color="#bac9cc" style={styles.inputIcon} />
            </View>
          </View>

          {globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0 && (
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={styles.label}>GLOBAL UNIT TYPE</Text>
              <GlassDropdown
                ref={isDesktop ? unitTypeDropdownRefDesktop : unitTypeDropdownRefMobile}
                options={UNIT_TYPE_OPTIONS}
                value={globalUnitType}
                onChange={setGlobalUnitType}
                placeholder="Select Unit Type"
                icon="home"
              />
            </View>
          )}
        </View>
      )}

      {/* Auto-Billing Cycle Day Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>AUTO-BILLING CYCLE DAY (1 - 31)</Text>
        <GlassDropdown
          options={BILLING_DAY_OPTIONS}
          value={autoBillDayOfMonth || ''}
          onChange={setAutoBillDayOfMonth}
          placeholder="Select billing cycle day..."
          icon="calendar-today"
        />

        {/* Quick Selection Pills */}
        <View style={[styles.amenitiesContainer, { marginTop: 6 }]}>
          {PRESET_BILLING_DAYS.map((preset) => {
            const isSelected = (autoBillDayOfMonth || '') === preset.value;
            return (
              <TouchableOpacity
                key={preset.label}
                onPress={() => setAutoBillDayOfMonth(preset.value)}
                activeOpacity={0.75}
                style={[
                  styles.amenityChip,
                  isSelected && styles.amenityChipSelected,
                  { paddingVertical: 6, paddingHorizontal: 12 },
                ]}
              >
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'event'}
                  size={16}
                  color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
                />
                <Text style={[styles.amenityChipText, isSelected && styles.amenityChipTextSelected, { fontSize: theme.Typography.bodySmall.fontSize }]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 4 }}>
          Day of the month when monthly rent cycle drafts are automatically generated for active leases.
        </Text>
      </View>

      {/* Property Amenities Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Property Amenities</Text>
        <View style={styles.amenitiesContainer}>
          {[
            'High-speed Fiber Wi-Fi',
            'Covered Parking',
            '24/7 Security',
            'Power Backup',
            'Rooftop Pool',
            '24/7 Fitness Center',
            'In-Building Laundry',
            'EV Charger',
            'Elevator',
            'Clubhouse & Lounge',
          ].map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity);
            return (
              <TouchableOpacity
                key={amenity}
                onPress={() => toggleAmenity(amenity)}
                activeOpacity={0.75}
                style={[styles.amenityChip, isSelected && styles.amenityChipSelected]}
              >
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'add-circle-outline'}
                  size={20}
                  color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
                />
                <Text style={[styles.amenityChipText, isSelected && styles.amenityChipTextSelected]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Property Photos Section */}
      <View style={styles.inputGroup}>
        <MediaUploadGrid
          ownerModule="PROPERTY"
          referenceId={propertyId}
          userToken={userToken}
          maxFiles={12}
          label="Property Photos"
          helperText="Upload exterior, lobby, or unit photos to showcase your property."
        />
      </View>

      {showSave && (
        <ActionButton
          label="Save Changes"
          icon="check"
          iconPosition="right"
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={saving}
          onPress={handleUpdate}
          style={{ marginTop: 16 }}
        />
      )}
    </>
  );

  const renderConfigCardContent = () => (
    <>
      <Text style={styles.sectionTitle}>Structure & Units</Text>
      <TouchableOpacity style={styles.configButton} activeOpacity={0.7} onPress={onConfigureFloors}>
        <View style={styles.configIconWrapper}>
          <MaterialIcons name="layers" size={24} color={theme.Colors.primary} />
        </View>
        <View style={styles.configTextWrapper}>
          <Text style={styles.configTitle}>Floor Layout Grid</Text>
          <Text style={styles.configSubtitle}>Assign tenants, draw units, and map layout bounds</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.Colors.onSurfaceVariant} />
      </TouchableOpacity>
    </>
  );

  if (loading) {
    return (
      <PageShell>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell scrollable keyboardAvoiding>
      {isDesktop ? (
        <View style={styles.desktopInner}>
          <View style={styles.desktopHeaderRow}>
            <TouchableOpacity
              onPress={onBack}
              style={{
                marginRight: 14,
                padding: 8,
                borderRadius: 12,
                backgroundColor: theme.Colors.glassFill,
                borderWidth: 1,
                borderColor: theme.Colors.glassStroke,
              }}
              activeOpacity={0.75}
            >
              <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
            </TouchableOpacity>
            <View style={styles.largeTitleContainerDesktop}>
              <Text style={styles.titleLineDesktop}>Modify Property Profile</Text>
              <Text style={styles.subtitleDesktop}>Configure location profiles and structural maps</Text>
            </View>

            <TouchableOpacity
              style={[styles.desktopSaveButton, saving && { opacity: 0.8 }]}
              onPress={handleUpdate}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <Text style={styles.desktopSaveButtonText}>Save Changes</Text>
                  <MaterialIcons name="check" size={20} color={theme.Colors.surfaceContainerLowest} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.desktopFormContainer}>
            <View style={styles.desktopFormLeft}>
              <View style={styles.card}>
                {renderFormFieldsContent(false)}
                <View style={styles.divider} />
                {renderConfigCardContent()}
              </View>
            </View>

            <View style={styles.desktopFormRight}>
              <View style={styles.desktop3DPreviewCard}>
                <Text style={styles.desktopPreviewLabel}>3D Isometric Preview</Text>

                <View style={styles.desktop3DContainer}>
                  <Building3DView
                    propertyId={propertyId}
                    token={userToken}
                    resetRotationTrigger={resetRotationTrigger}
                  />

                  <TouchableOpacity
                    style={styles.resetButtonOverlay}
                    activeOpacity={0.7}
                    onPress={() => setResetRotationTrigger((prev) => prev + 1)}
                  >
                    <MaterialIcons name="refresh" size={18} color={theme.Colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.previewInfoRow}>
                  <Text style={styles.previewName}>{name || 'Property Name'}</Text>
                  <Text style={styles.previewAddress}>
                    {address ? `${address}, ${city}` : 'No Address Specified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.card}>
            {renderFormFieldsContent(true)}
            <View style={styles.divider} />
            {renderConfigCardContent()}
          </View>
        </View>
      )}
    </PageShell>
  );
}
