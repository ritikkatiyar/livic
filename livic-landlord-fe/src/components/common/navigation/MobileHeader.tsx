import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useProperties } from '@/src/hooks/useProperties';

interface MobileHeaderProps {
  title: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function MobileHeader({ title, onMenuPress, onNotificationPress, showBackButton, onBackPress }: MobileHeaderProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();

  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const { properties } = useProperties();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId);
  const propertyLabel = selectedProperty ? selectedProperty.name : 'All Properties';

  const filteredProperties = (properties || []).filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mobile-header-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
          }
          @media (min-width: 900px) {
            .mobile-header-container {
              display: none !important;
            }
          }
        `}} />
      )}
      <View
        // @ts-ignore
        dataSet={{ mobileHeader: 'true', responsiveLayout: 'mobile' }}
        className="mobile-header-container"
        style={[styles.headerWrapper, { paddingTop: insets.top, minHeight: 56 + insets.top }]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerLeftGroup}>
            {/* Compact Mobile Property Selector Trigger */}
            <TouchableOpacity
              style={styles.propertySelectorPill}
              activeOpacity={0.75}
              onPress={() => setIsSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Select property, currently ${propertyLabel}`}
            >
              <MaterialIcons
                name="business"
                size={15}
                color={selectedPropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
              />
              <Text style={styles.propertySelectorText} numberOfLines={1}>
                {propertyLabel}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
              onPress={onNotificationPress}
              disabled={!onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={theme.Colors.onSurface} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Property Selection Modal / Bottom Sheet */}
        <Modal
          visible={isSheetOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsSheetOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setIsSheetOpen(false)}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Select Property</Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search properties..."
                  placeholderTextColor={theme.Colors.onSurfaceVariant}
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                />
                {searchFilter ? (
                  <TouchableOpacity onPress={() => setSearchFilter('')}>
                    <Ionicons name="close-circle" size={18} color={theme.Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.propertyList} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  style={[
                    styles.propertyItem,
                    !selectedPropertyId && styles.propertyItemActive,
                  ]}
                  onPress={() => {
                    setSelectedPropertyId(null);
                    setIsSheetOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="storefront"
                    size={20}
                    color={!selectedPropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.propertyItemText,
                      !selectedPropertyId && styles.propertyItemTextActive,
                    ]}
                  >
                    All Properties
                  </Text>
                  {!selectedPropertyId && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.Colors.primary} />
                  )}
                </TouchableOpacity>

                {filteredProperties.map((p) => {
                  const isSelected = p.id === selectedPropertyId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.propertyItem, isSelected && styles.propertyItemActive]}
                      onPress={() => {
                        setSelectedPropertyId(p.id);
                        setIsSheetOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name="business"
                        size={20}
                        color={isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.propertyItemText,
                          isSelected && styles.propertyItemTextActive,
                        ]}
                      >
                        {p.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 999,
  },
  headerContainer: {
    height: 56,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
    gap: theme.Spacing.xs,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertySelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  propertySelectorText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    maxWidth: 160,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationButton: {
    padding: theme.Spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.error || '#ba1a1a',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.4)',
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '70%',
    paddingBottom: 30,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.Colors.outlineVariant,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  propertyList: {
    paddingHorizontal: 16,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  propertyItemActive: {
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  propertyItemText: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  propertyItemTextActive: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
});
