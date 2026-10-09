import { useAppTheme } from '@/src/theme/ThemeContext';
import { RAIL_WIDTH, useLiviInTopBar } from './bottomDock';
import { useResponsive } from '@/src/hooks/useResponsive';
import { requestOpenAssistant } from './assistantEvents';
import { AssistantMascot } from './AssistantMascot';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  type LayoutChangeEvent,
} from 'react-native';
import { usePathname } from 'expo-router';
import { useScrolledUnder, useScrollNav, useTitleScrolledAway } from './ScrollContext';
import { getRouteTitle } from './routeTitles';
import { Motion, useReducedMotion } from '@/src/theme/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useProperties } from '@/src/hooks/useProperties';

/** Height of the header row itself; the safe-area inset is added on top. */
const HEADER_CONTENT_HEIGHT = 56;

interface MobileHeaderProps {
  /** Reports the header size; it is positioned absolutely, so callers cannot measure it. */
  onLayout?: (event: LayoutChangeEvent) => void;
}

export default function MobileHeader({ onLayout }: MobileHeaderProps) {
  // Once the page's own heading scrolls away, the bar repeats it, so you always know where you are
  const pageTitle = getRouteTitle(usePathname());
  const titleScrolledAway = useTitleScrolledAway();
  const { requestScrollToTop } = useScrollNav();
  // At the top the bar sits flat on the page; once content passes under it, its edge appears
  const scrolledUnder = useScrolledUnder();
  const showPageTitle = !!pageTitle && titleScrolledAway;
  const reduceMotion = useReducedMotion();
  const titleProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(titleProgress, {
      toValue: showPageTitle ? 1 : 0,
      duration: reduceMotion ? 0 : Motion.duration.quick,
      easing: Motion.easeOut,
      useNativeDriver: Motion.nativeDriver,
    }).start();
  }, [showPageTitle, reduceMotion, titleProgress]);
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();
  const liviInTopBar = useLiviInTopBar();
  const { isTablet } = useResponsive();

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
        onLayout={onLayout}
        style={[styles.headerWrapper, scrolledUnder && styles.headerWrapperScrolled, { paddingTop: insets.top, minHeight: HEADER_CONTENT_HEIGHT + insets.top }]}
      >
        <View style={[styles.headerContainer, isTablet && { paddingLeft: RAIL_WIDTH + theme.Spacing.md }]}>
          <View style={styles.headerLeftGroup}>
            {/* Compact Mobile Property Selector Trigger; gives way to the page title while scrolled */}
            <Animated.View
              style={{ opacity: titleProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}
              pointerEvents={showPageTitle ? 'none' : 'auto'}
            >
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
            </Animated.View>
            {/* The title keeps the property in view under it, so a scrolled page never hides which
                property you are acting on. Tapping it goes back to the top, where the selector is. */}
            {pageTitle ? (
              <Animated.View
                style={[styles.compactTitle, { opacity: titleProgress }]}
                pointerEvents={showPageTitle ? 'auto' : 'none'}
                accessibilityElementsHidden={!showPageTitle}
                importantForAccessibility={showPageTitle ? 'auto' : 'no-hide-descendants'}
              >
                <TouchableOpacity
                  onPress={requestScrollToTop}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${pageTitle}, ${selectedProperty ? selectedProperty.name : 'all properties'}. Scroll to top`}
                >
                  <Text style={styles.compactTitleText} numberOfLines={1}>{pageTitle}</Text>
                  <Text style={styles.compactScopeText} numberOfLines={1}>
                    {selectedProperty ? selectedProperty.name : 'All properties'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </View>

          {/* No bell: it only reopened Issues, whose tab badge already counts what needs attention.
              It can return as an activity inbox. On narrow screens and with large text, Livi sits here. */}
          {liviInTopBar ? (
            <TouchableOpacity
              style={styles.liviButton}
              activeOpacity={0.75}
              onPress={requestOpenAssistant}
              accessibilityRole="button"
              accessibilityLabel="Ask Livi, AI assistant"
            >
              <AssistantMascot size={36} color={theme.Colors.surfaceContainerHigh} featureColor={theme.Colors.primary} />
            </TouchableOpacity>
          ) : null}
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
                  placeholderTextColor={theme.Colors.placeholder}
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
    borderBottomColor: 'transparent',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 12,
    elevation: 0,
    zIndex: 999,
  },
  headerWrapperScrolled: {
    borderBottomColor: theme.Colors.outlineVariant,
    shadowOpacity: isDark ? 0.3 : 0.06,
    elevation: 4,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liviButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 0,
    borderWidth: 1.5,
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compactTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  compactTitleText: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  compactScopeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
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
    borderColor: theme.Colors.outlineStrong,
  },
  propertySelectorText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    maxWidth: 160,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.Colors.scrim || theme.Colors.scrim,
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
    borderColor: theme.Colors.outlineStrong,
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
