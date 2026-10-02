import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { withAlpha } from '@/src/theme/colorUtils';

interface ChargeIdentityCardProps {
  expenseName: string;
  setExpenseName: (val: string) => void;
  billingFrequency: string;
  setBillingFrequency: (val: string) => void;
  nameError: string;
  setNameError: (val: string) => void;
  isDark: boolean;
}

export function ChargeIdentityCard({
  expenseName,
  setExpenseName,
  billingFrequency,
  setBillingFrequency,
  nameError,
  setNameError,
  isDark,
}: ChargeIdentityCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Charge Identity</Text>
      </View>

      <Text style={styles.label}>CHARGE NAME</Text>
      <View style={[styles.inputContainer, nameError ? { borderColor: theme.Colors.error, marginBottom: theme.Spacing.sm } : null]}>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Electricity, Sanitation Service" 
          placeholderTextColor={theme.Colors.outlineVariant}
          value={expenseName}
          onChangeText={(val) => {
            setExpenseName(val);
            if (val.trim()) setNameError('');
          }}
        />
      </View>
      {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

      <Text style={styles.label}>BILLING FREQUENCY</Text>
      <View style={styles.segmentContainer}>
        {['Monthly', 'Annual', 'Weekly'].map((freq) => {
          const isActive = billingFrequency === freq;
          return (
            <TouchableOpacity 
              key={freq}
              style={styles.segmentButtonWrapper}
              onPress={() => setBillingFrequency(freq)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <View style={[styles.segmentButtonActive, isDark ? styles.segmentButtonActiveDark : styles.segmentButtonActiveLight]}>
                  <Text style={[styles.segmentTextActive, isDark && { color: theme.Colors.primary }]}>{freq}</Text>
                </View>
              ) : (
                <View style={styles.segmentButtonInactive}>
                  <Text style={styles.segmentText}>{freq}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean = false) => StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  label: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: theme.Spacing.sm,
  },
  inputContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: isDark ? withAlpha(theme.Colors.onSurface, 0.12) : theme.Colors.glassStroke,
    backgroundColor: isDark ? theme.Colors.surfaceContainerLowest : theme.Colors.glassFill,
    justifyContent: 'center',
    paddingHorizontal: theme.Spacing.md,
    marginBottom: 20,
  },
  input: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  errorText: {
    color: theme.Colors.error,
    fontSize: theme.Typography.bodySmall.fontSize,
    marginTop: -12,
    marginBottom: 18,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    backgroundColor: isDark ? theme.Colors.surfaceContainerLowest : theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: isDark ? withAlpha(theme.Colors.onSurface, 0.08) : theme.Colors.glassStroke,
    padding: theme.Spacing.xs,
  },
  segmentButtonWrapper: {
    flex: 1,
    height: '100%',
  },
  segmentButtonActive: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonActiveDark: {
    backgroundColor: withAlpha(theme.Colors.primary, 0.15),
    borderWidth: 1,
    borderColor: theme.Colors.primary,
  },
  segmentButtonActiveLight: {
    backgroundColor: theme.Colors.primary,
  },
  segmentButtonInactive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentTextActive: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  segmentText: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '700',
  },
});
