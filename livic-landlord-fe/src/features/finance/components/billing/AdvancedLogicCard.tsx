import React from 'react';
import { haptic } from '@/src/theme/haptics';
import { View, Text, StyleSheet, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { withAlpha } from '@/src/theme/colorUtils';

interface AdvancedLogicCardProps {
  applySalesTax: boolean;
  setApplySalesTax: (val: boolean) => void;
  autoCarryForward: boolean;
  setAutoCarryForward: (val: boolean) => void;
  lateFee: string;
  setLateFee: (val: string) => void;
  isDark: boolean;
}

export function AdvancedLogicCard({
  applySalesTax,
  setApplySalesTax,
  autoCarryForward,
  setAutoCarryForward,
  lateFee,
  setLateFee,
  isDark,
}: AdvancedLogicCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="settings-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Advanced Logic</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.settingText}>Apply Sales Tax</Text>
        <Switch 
          value={applySalesTax} 
          onValueChange={(val) => {
            haptic('tap');
            setApplySalesTax(val);
          }}
          trackColor={{ false: isDark ? withAlpha(theme.Colors.onSurface, 0.16) : theme.Colors.surfaceContainerHigh, true: theme.Colors.primary }}
          thumbColor={theme.Colors.onPrimary}
        />
      </View>

      <View style={[styles.rowBetween, { marginTop: 20 }]}>
        <Text style={styles.settingText}>Auto-Carry Forward</Text>
        <Switch 
          value={autoCarryForward} 
          onValueChange={(val) => {
            haptic('tap');
            setAutoCarryForward(val);
          }}
          trackColor={{ false: isDark ? withAlpha(theme.Colors.onSurface, 0.16) : theme.Colors.surfaceContainerHigh, true: theme.Colors.primary }}
          thumbColor={theme.Colors.onPrimary}
        />
      </View>

      <View style={[styles.rowBetween, { marginTop: theme.Spacing.lg, marginBottom: theme.Spacing.lg }]}>
        <Text style={styles.settingText}>Late Fee Rules</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{lateFee || '0'}% / Monthly</Text>
        </View>
      </View>

      <Text style={styles.label}>LATE FEE %</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.inputWithIcon} 
          placeholder="5" 
          placeholderTextColor={theme.Colors.placeholder}
          keyboardType="numeric"
          value={lateFee}
          onChangeText={setLateFee}
        />
        <Text style={styles.percentSymbol}>%</Text>
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: isDark ? withAlpha(theme.Colors.primary, 0.12) : withAlpha(theme.Colors.primary, 0.08),
    borderWidth: 1,
    borderColor: isDark ? withAlpha(theme.Colors.primary, 0.25) : withAlpha(theme.Colors.primary, 0.18),
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
  },
  inputWithIcon: {
    flex: 1,
    height: '100%',
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  percentSymbol: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
    marginLeft: theme.Spacing.sm,
  },
});
