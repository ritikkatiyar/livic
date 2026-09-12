import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MediaUploadGrid } from '@/src/components/common/display/MediaUploadGrid';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useResponsive } from '@/src/hooks/useResponsive';

export default function UnitDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const params = useLocalSearchParams<{ id?: string; propertyId?: string; unitNumber?: string }>();
  const { accessToken } = useAuth();
  const { selectedPropertyId } = useGlobalPropertySelection();

  const propertyId = params.propertyId || selectedPropertyId || '';
  const unitId = params.id || 'unit-detail';
  const unitNumber = params.unitNumber || 'Unit';

  return (
    <PageShell scrollable={true}>
      <View style={styles.container}>
        {/* Navigation / Header */}
        <View style={styles.header}>
          {isDesktop && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <MaterialIcons name="arrow-back" size={20} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{unitNumber}</Text>
            <Text style={styles.subtitle}>Unit Specifications & Media</Text>
          </View>
        </View>

        {/* Room / Unit Photos Section */}
        <View style={styles.card}>
          <MediaUploadGrid
            ownerModule="PROPERTY"
            referenceId={propertyId || undefined}
            userToken={accessToken || ''}
            maxFiles={10}
            label={`${unitNumber} Photos`}
            helperText="Upload high-resolution room photos, floor layout, or move-in condition snaps."
            caption={`unit:${unitId}:${unitNumber}`}
            filterCaption={`unit:${unitId}:${unitNumber}`}
          />
        </View>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    padding: theme.Spacing.md,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.Typography.headlineMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: theme.Colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});
