import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useIssues } from '@/src/features/issues/hooks/useIssues';

export interface PropertyOption {
  id: string;
  name: string;
}

interface DesktopNavBarProps {
  onBack?: () => void;
  backText?: string;
  rightContent?: React.ReactNode;
  properties?: PropertyOption[];
  selectedPropertyId?: string | null;
  onPropertyChange?: (propertyId: string) => void;
  title?: string;
  activeTab?: string;
  hideTabs?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPopoverList?: boolean;
}

export default function DesktopNavBar({ 
  onBack, 
  backText = 'Back to Portfolio',
  rightContent,
  properties = [],
  selectedPropertyId,
  onPropertyChange,
  title,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showPopoverList = true,
}: DesktopNavBarProps) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'A';

  const { metrics } = useIssues(accessToken);
  const unreadCount = metrics?.escalated || 0;

  const [localSearch, setLocalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const query = searchQuery !== undefined ? searchQuery : localSearch;
  const selectedProp = properties.find(p => p.id === selectedPropertyId);
  /** The popover that lists properties only exists when the search box is rendered with properties to choose from. */
  const canSelectProperty = Boolean(properties.length > 0 && onPropertyChange && (showSearch || onSearchChange) && showPopoverList);

  const filteredProperties = (properties || []).filter(p =>
    !query || p.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleTextChange = (text: string) => {
    if (onSearchChange) {
      onSearchChange(text);
    } else {
      setLocalSearch(text);
    }
  };

  return (
    <View style={styles.topbar}>
      {/* Left Area: Scope Dropdown (Context Anchor) + Optional Breadcrumb */}
      <View style={styles.topbarLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop} activeOpacity={0.75}>
            <MaterialIcons name="arrow-back" size={18} color={theme.Colors.onBackground} />
            <Text style={styles.backButtonTextDesktop}>{backText}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Current property scope. Opens the same list as the search popover, which is where the choice is made. */}
        {canSelectProperty ? (
          <TouchableOpacity
            style={styles.propertyScopeBadge}
            onPress={() => setIsSearchFocused(prev => !prev)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Select property, currently ${selectedProp ? selectedProp.name : 'All Properties'}`}
          >
            <MaterialIcons name="apartment" size={16} color={theme.Colors.primary} />
            <Text style={styles.propertyScopeBadgeText} numberOfLines={1}>
              {selectedProp ? selectedProp.name : 'All Properties'}
            </Text>
            <MaterialIcons
              name={isSearchFocused ? 'arrow-drop-up' : 'arrow-drop-down'}
              size={18}
              color={theme.Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.propertyScopeBadge}>
            <MaterialIcons name="apartment" size={16} color={theme.Colors.primary} />
            <Text style={styles.propertyScopeBadgeText} numberOfLines={1}>
              {selectedProp ? selectedProp.name : 'All Properties'}
            </Text>
          </View>
        )}
      </View>

      {/* Right Area: Search + Actions */}
      <View style={styles.topbarRight}>
        {/* Local In-Page / Global Search Box with Property Selection Dropdown */}
        {(showSearch || onSearchChange) && (
          <View style={{ position: 'relative', zIndex: 1002 }}>
            {/* Transparent backdrop to dismiss popover on outside click */}
            {isSearchFocused && (
              <TouchableOpacity
                style={styles.popoverBackdrop}
                activeOpacity={1}
                onPress={() => setIsSearchFocused(false)}
              />
            )}

            <View style={[styles.searchBox, { zIndex: 1002 }]}>
              <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={query}
                onChangeText={handleTextChange}
                onFocus={() => setIsSearchFocused(true)}
              />
              {query ? (
                <TouchableOpacity 
                  onPress={() => {
                    setLocalSearch('');
                    if (onSearchChange) onSearchChange('');
                  }} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ) : properties.length > 0 && onPropertyChange ? (
                <TouchableOpacity 
                  onPress={() => setIsSearchFocused(prev => !prev)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons 
                    name={isSearchFocused ? "arrow-drop-up" : "arrow-drop-down"} 
                    size={20} 
                    color={theme.Colors.onSurfaceVariant} 
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Property search & select suggestions popover directly under the RHS search bar */}
            {isSearchFocused && properties.length > 0 && onPropertyChange && (
              <View style={styles.searchSuggestionsPopover}>
                <View style={styles.popoverHeader}>
                  <Text style={styles.popoverHeaderText}>SELECT PROPERTY</Text>
                  <TouchableOpacity onPress={() => setIsSearchFocused(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={14} color={theme.Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                  {/* Option: All Properties */}
                  {(!query || 'all properties'.includes(query.toLowerCase())) && (
                    <TouchableOpacity
                      style={[
                        styles.searchSuggestionItem,
                        !selectedPropertyId && styles.searchSuggestionItemActive
                      ]}
                      onPress={() => {
                        onPropertyChange(null as any);
                        setIsSearchFocused(false);
                        setLocalSearch('');
                        if (onSearchChange) onSearchChange('');
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons 
                        name="storefront" 
                        size={16} 
                        color={!selectedPropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant} 
                      />
                      <Text 
                        style={[
                          styles.searchSuggestionText,
                          !selectedPropertyId && styles.searchSuggestionTextActive
                        ]}
                        numberOfLines={1}
                      >
                        All Properties
                      </Text>
                      {!selectedPropertyId && (
                        <MaterialIcons name="check" size={16} color={theme.Colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Matching properties */}
                  {filteredProperties.map(p => {
                    const isSelected = p.id === selectedPropertyId;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.searchSuggestionItem,
                          isSelected && styles.searchSuggestionItemActive
                        ]}
                        onPress={() => {
                          onPropertyChange(p.id);
                          setIsSearchFocused(false);
                          setLocalSearch('');
                          if (onSearchChange) onSearchChange('');
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons 
                          name="business" 
                          size={16} 
                          color={isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant} 
                        />
                        <Text 
                          style={[
                            styles.searchSuggestionText,
                            isSelected && styles.searchSuggestionTextActive
                          ]}
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color={theme.Colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {filteredProperties.length === 0 && query && !'all properties'.includes(query.toLowerCase()) && (
                    <View style={styles.emptySuggestionItem}>
                      <Text style={styles.emptySuggestionText}>No matching properties</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {rightContent}

        <TouchableOpacity 
          style={styles.themeToggleButton} 
          onPress={toggleTheme}
          activeOpacity={0.75}
        >
          <MaterialIcons 
            name={isDark ? "wb-sunny" : "dark-mode"} 
            size={20} 
            color={isDark ? theme.Colors.tertiary : theme.Colors.onSurfaceVariant} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={() => router.push('/escalations')}
          activeOpacity={0.75}
        >
          <Ionicons name="notifications-outline" size={23} color={theme.Colors.onSurface} />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    zIndex: 999,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBarTitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: -0.2,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  backButtonTextDesktop: {
    fontSize: theme.Typography.labelMedium.fontSize,
    color: theme.Colors.onBackground,
    fontWeight: '600',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyScopeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    maxWidth: 220,
  },
  propertyScopeBadgeText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    flexShrink: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 280,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    gap: theme.Spacing.xs,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  themeToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  popoverBackdrop: {
    ...(Platform.OS === 'web' ? { position: 'fixed' as any } : { position: 'absolute' as any }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  searchSuggestionsPopover: {
    position: 'absolute',
    top: 46,
    left: 0,
    width: 280,
    borderRadius: theme.Rounded.md,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    overflow: 'hidden',
    shadowColor: theme.Colors.onSurface,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1005,
    paddingVertical: 6,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
    marginBottom: 4,
  },
  popoverHeaderText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  searchSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchSuggestionItemActive: {
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  searchSuggestionText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '500',
  },
  searchSuggestionTextActive: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  emptySuggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptySuggestionText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  badgeText: {
    color: theme.Colors.onError,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '600',
  },
});
