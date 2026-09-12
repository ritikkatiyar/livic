import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface TopUpCardProps {
  topUpAmount: string;
  isTopUpProcessing: boolean;
  subscribingPlanKey: string | null;
  setTopUpAmount: (val: string) => void;
  onTopUp: () => void;
}

export function TopUpCard({
  topUpAmount,
  isTopUpProcessing,
  subscribingPlanKey,
  setTopUpAmount,
  onTopUp,
}: TopUpCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.topUpCard}>
      <Text style={styles.calculatorTitle}>METERED CREDIT WALLET TOP-UP</Text>
      <Text style={styles.calculatorSub}>Out-of-bundle credit purchases (never expire):</Text>

      <View style={styles.topUpInputContainer}>
        <Text style={styles.dollarPrefix}>₹</Text>
        <TextInput
          style={styles.topUpInput}
          keyboardType="numeric"
          value={topUpAmount}
          onChangeText={setTopUpAmount}
          placeholder="500"
          placeholderTextColor={theme.Colors.onSurfaceVariant}
        />
        <Text style={styles.creditsConversion}>
          = +{(parseFloat(topUpAmount || '0')).toLocaleString()} Credits
        </Text>
      </View>

      <View style={styles.topUpPresets}>
        {['500', '1000', '2500', '5000'].map((val) => (
          <TouchableOpacity
            key={val}
            style={[styles.presetBtn, topUpAmount === val && styles.presetBtnActive]}
            onPress={() => setTopUpAmount(val)}
          >
            <Text style={[styles.presetText, topUpAmount === val && styles.presetTextActive]}>₹{parseInt(val, 10).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.topUpSubmit} onPress={onTopUp} disabled={isTopUpProcessing || subscribingPlanKey !== null}>
        {isTopUpProcessing ? (
          <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
        ) : (
          <View style={styles.topUpSubmitGradient}>
            <Ionicons name="shield-checkmark" size={18} color={theme.Colors.surfaceContainerLowest} />
            <Text style={styles.topUpSubmitText}>PROCEED TO PAYMENT</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  topUpCard: {
    borderRadius: 16,
    padding: theme.Spacing.lg,
    marginVertical: 15,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  calculatorTitle: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: theme.Spacing.xs,
  },
  calculatorSub: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 20,
  },
  topUpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    marginBottom: theme.Spacing.md,
  },
  dollarPrefix: {
    fontSize: theme.Typography.titleLarge.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
  },
  topUpInput: {
    flex: 1,
    fontSize: theme.Typography.titleLarge.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
    paddingHorizontal: theme.Spacing.sm,
  },
  creditsConversion: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  topUpPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.lg,
  },
  presetBtn: {
    flex: 1,
    marginHorizontal: theme.Spacing.xs,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  presetBtnActive: {
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  presetText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  presetTextActive: {
    color: theme.Colors.primary,
  },
  topUpSubmit: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  topUpSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: theme.Spacing.sm,
    backgroundColor: theme.Colors.primary,
  },
  topUpSubmitText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.buttonText.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
