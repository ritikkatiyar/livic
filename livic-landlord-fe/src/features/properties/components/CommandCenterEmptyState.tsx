import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface CommandCenterEmptyStateProps {
  onNavigateToCreateProperty: () => void;
}

export function CommandCenterEmptyState({ onNavigateToCreateProperty }: CommandCenterEmptyStateProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="domain-disabled" size={36} color={theme.Colors.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>No properties found.</Text>
      <Text style={styles.emptySubtitle}>
        Start building your portfolio by adding your first property to the command center.
      </Text>
      
      <TouchableOpacity 
        style={styles.createPropertyButton} 
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
        <Text style={styles.createPropertyText}>Create Property</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.learnMoreContainer}>
        <MaterialIcons name="help-outline" size={16} color={theme.Colors.primary} />
        <Text style={styles.learnMoreText}>Learn about property management</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  emptyCard: {
    borderRadius: theme.Rounded.xl,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: theme.Rounded.xl,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 380,
    marginBottom: theme.Spacing.xl,
  },
  createPropertyButton: {
    borderRadius: theme.Rounded.lg,
    backgroundColor: theme.Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: theme.Spacing.lg,
  },
  createPropertyText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  learnMoreText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1,
  },
});
