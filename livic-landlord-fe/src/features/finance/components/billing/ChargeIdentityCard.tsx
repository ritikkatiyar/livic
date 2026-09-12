import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface ChargeIdentityCardProps {
  expenseName: string;
  setExpenseName: (val: string) => void;
  chargeCategory: string;
  setChargeCategory: (val: string) => void;
  billingFrequency: string;
  setBillingFrequency: (val: string) => void;
  nameError: string;
  setNameError: (val: string) => void;
  isDark: boolean;
}

export function ChargeIdentityCard({
  expenseName,
  setExpenseName,
  chargeCategory,
  setChargeCategory,
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

      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.categoryRow}>
        {['RENT', 'ELECTRICITY', 'SERVICE', 'PENALTY', 'DISCOUNT', 'CUSTOM'].map((cat) => {
          const isActive = chargeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                isActive && (isDark ? styles.categoryButtonActiveDark : styles.categoryButtonActiveLight),
              ]}
              onPress={() => setChargeCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.categoryText,
                isActive && (isDark ? styles.categoryTextActiveDark : styles.categoryTextActiveLight),
              ]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.Colors.glassStroke,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : theme.Colors.glassFill,
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.xs,
    marginBottom: theme.Spacing.lg,
  },
  categoryButton: {
    paddingVertical: theme.Spacing.sm,
    paddingHorizontal: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : theme.Colors.glassFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.Colors.glassStroke,
  },
  categoryButtonActiveDark: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.Colors.primary,
  },
  categoryButtonActiveLight: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  categoryText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  categoryTextActiveDark: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  categoryTextActiveLight: {
    color: theme.Colors.onPrimary,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.65)' : theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.Colors.glassStroke,
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
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
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
