import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';

export interface PropertyRequiredBannerProps {
  title?: string;
  description?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  selectedPropertyId?: string | null;
  onSelectProperty?: (propertyId: string) => void;
  properties?: Array<{ id: string; name: string }>;
  allowAll?: boolean;
  onSelectAll?: () => void;
  style?: ViewStyle;
  inline?: boolean;
  onClose?: () => void;
}

export function PropertyRequiredBanner({
  title = 'Select Active Property',
  description = 'Choose a property below to scope your worksheets, charges, ledger, and records.',
  icon = 'account-balance',
  selectedPropertyId: propSelectedId,
  onSelectProperty: propOnSelect,
  properties: propProperties,
  allowAll = false,
  onSelectAll,
  style,
  onClose,
}: PropertyRequiredBannerProps) {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const globalContext = useGlobalPropertySelection();
  const { properties: fetchedProperties } = useProperties();

  const activePropertyId = propSelectedId !== undefined ? propSelectedId : globalContext.selectedPropertyId;
  const handleSelect = propOnSelect || globalContext.setSelectedPropertyId;
  const propertyList = propProperties || fetchedProperties || [];

  const [dismissed, setDismissed] = useState(false);

  if (activePropertyId || dismissed) {
    return null;
  }

  const handlePropertyChosen = (id: string) => {
    handleSelect(id);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) onClose();
  };

  return (
    <View style={[styles.inlineWrapper, style]}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
        >
          <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <MaterialIcons name={icon} size={32} color={theme.Colors.primary} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {propertyList.length > 0 ? (
          <View style={styles.propertiesContainer}>
            <Text style={styles.sectionLabel}>CHOOSE A PROPERTY TO CONTINUE</Text>
            <View style={styles.pillsRow}>
              {allowAll && (
                <TouchableOpacity
                  style={[styles.pill, !activePropertyId && styles.pillActive]}
                  onPress={() => {
                    if (onSelectAll) onSelectAll();
                    else handleSelect(null as any);
                    setDismissed(true);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="domain"
                    size={16}
                    color={!activePropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.pillText, !activePropertyId && styles.pillTextActive]}>
                    All Properties
                  </Text>
                </TouchableOpacity>
              )}
              {propertyList.map((prop) => {
                const isSelected = prop.id === activePropertyId;
                return (
                  <TouchableOpacity
                    key={prop.id}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => handlePropertyChosen(prop.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name="apartment"
                      size={16}
                      color={isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {prop.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              setDismissed(true);
              router.push('/properties/create');
            }}
            activeOpacity={0.85}
          >
            <View
              style={[styles.createButtonGradient, { backgroundColor: theme.Colors.primary }]}
            >
              <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.createButtonText}>CREATE FIRST PROPERTY</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    inlineWrapper: {
      width: '100%',
      paddingVertical: theme.Spacing.md,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 560,
      padding: theme.Spacing.xl,
      borderRadius: 24,
      alignItems: 'center',
      backgroundColor: theme.Colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.1,
      shadowRadius: 32,
      elevation: 6,
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.Colors.surfaceContainerLow,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: theme.Colors.surfaceContainerLow,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.Spacing.md,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
    },
    title: {
      ...theme.Typography.headlineSmall,
      color: theme.Colors.onSurface,
      marginBottom: theme.Spacing.xs,
      textAlign: 'center',
    },
    description: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      color: theme.Colors.onSurfaceVariant,
      textAlign: 'center',
      maxWidth: 440,
      lineHeight: 22,
      marginBottom: theme.Spacing.lg,
    },
    propertiesContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: theme.Spacing.xs,
    },
    sectionLabel: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 1,
      marginBottom: 12,
    },
    pillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 100,
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
    },
    pillActive: {
      backgroundColor: `${theme.Colors.primary}18`,
      borderColor: theme.Colors.primary,
    },
    pillText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
    },
    pillTextActive: {
      color: theme.Colors.primary,
      fontWeight: '600',
    },
    createButton: {
      borderRadius: 100,
      overflow: 'hidden',
      marginTop: theme.Spacing.xs,
    },
    createButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 100,
    },
    createButtonText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: theme.Colors.surfaceContainerLowest,
    },
  });
