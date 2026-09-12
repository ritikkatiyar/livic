import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: string) => Promise<void>;
  isLoading: boolean;
}

const MODES = [
  {
    id: 'RENTAL',
    label: 'Rental Block',
    icon: 'domain',
    badge: null,
    disabled: false,
  },
  {
    id: 'RESIDENTIAL',
    label: 'Residential Block',
    icon: 'house',
    badge: null,
    disabled: false,
  },
] as const;

export default function ModeSelectionScreen({ onSelectMode, isLoading }: ModeSelectionScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handlePress = async (id: string) => {
    setSelectedId(id);
    try {
      await onSelectMode(id);
    } catch (error) {
      setSelectedId(null);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
    }
  };

  const renderCard = (mode: typeof MODES[number]) => {
    const isSelected = selectedId === mode.id;

    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          styles.cardContainer,
          mode.disabled && styles.cardDisabled,
          isSelected && styles.cardSelected,
        ]}
        onPress={() => !mode.disabled && handlePress(mode.id)}
        activeOpacity={mode.disabled ? 1 : 0.7}
        disabled={mode.disabled || isLoading}
      >
        <View style={styles.cardInner}>
          <View style={styles.iconWrapper}>
            <MaterialIcons 
              name={mode.icon as any} 
              size={36} 
              color={mode.disabled ? theme.Colors.outline : isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant} 
            />
          </View>
          <Text style={[styles.cardLabel, mode.disabled && styles.labelDisabled]}>
            {mode.label}
          </Text>
          
          {mode.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{mode.badge}</Text>
            </View>
          )}

          {isSelected && isLoading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator color={theme.Colors.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <PageShell
      scrollable={false}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <Text style={styles.title}>What do you want to manage?</Text>
        <Text style={styles.subtitle}>Select a property type to get started</Text>
        
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {MODES.map(renderCard)}
        </View>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.Spacing.containerPadding,
  },
  title: {
    fontSize: theme.Typography.headlineMd.fontSize,
    fontWeight: theme.Typography.headlineMd.fontWeight as any,
    color: theme.Colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.Spacing.stackSm,
  },
  subtitle: {
    fontSize: theme.Typography.bodyMd.fontSize,
    color: theme.Colors.outline,
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.Spacing.gutter,
    maxWidth: 400,
  },
  gridDesktop: {
    maxWidth: 600,
    gap: theme.Spacing.lg,
  },
  cardContainer: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: theme.Rounded.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardSelected: {
    borderColor: theme.Colors.primary,
    shadowColor: theme.Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.Spacing.gutter,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(0, 104, 117, 0.2)' : 'rgba(0, 104, 117, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: theme.Typography.bodyMd.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    textAlign: 'center',
  },
  labelDisabled: {
    color: theme.Colors.outlineVariant,
  },
  badge: {
    position: 'absolute',
    top: theme.Spacing.stackSm,
    right: theme.Spacing.stackSm,
    backgroundColor: theme.Colors.surfaceContainer,
    paddingHorizontal: theme.Spacing.stackSm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.md,
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.outline,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
