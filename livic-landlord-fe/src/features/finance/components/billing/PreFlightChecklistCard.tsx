import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { PreFlightChecklistResponse } from '@/src/features/finance/api/rentCycle.api';

interface PreFlightChecklistCardProps {
  checklist: PreFlightChecklistResponse | null;
  billingMonth: string;
  isGenerating: boolean;
  isDesktop: boolean;
  onGenerate: () => void;
}

export function PreFlightChecklistCard({
  checklist,
  billingMonth,
  isGenerating,
  isDesktop,
  onGenerate,
}: PreFlightChecklistCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.cardTitle}>Draft Billing Worksheet</Text>
      <Text style={styles.cardText}>
        Rent cycles have not been compiled yet for this billing month. Verify your readings and configuration checklist below.
      </Text>

      {checklist && (
        <View style={styles.checklistGrid}>
          <View style={styles.checklistItem}>
            <Text style={styles.checklistLabel}>Active Leases</Text>
            <Text style={styles.checklistValue}>{checklist.activeLeases} / {checklist.totalUnits}</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checklistLabel}>Utility Readings</Text>
            <Text style={styles.checklistValue}>
              {checklist.meterReadingsEntered} / {checklist.meterReadingsExpected}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.statusBox, checklist && !checklist.isReady && { backgroundColor: theme.Colors.errorContainer }]}>
        <MaterialIcons 
          name={checklist && !checklist.isReady ? "warning" : "info-outline"} 
          size={20} 
          color={checklist && !checklist.isReady ? theme.Colors.error : theme.Colors.primary} 
        />
        <Text style={[styles.statusText, checklist && !checklist.isReady && { color: theme.Colors.error }]}>
          {checklist && !checklist.isReady ? "Please complete required readings before generating." : `Ready to compile invoices for ${billingMonth}`}
        </Text>
      </View>

      {isDesktop && (
        <ActionButton
          title="GENERATE INVOICES"
          onPress={onGenerate}
          loading={isGenerating}
          disabled={isGenerating || !!(checklist && !checklist.isReady)}
          style={styles.generateBtn}
        />
      )}
    </GlassCard>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: { padding: theme.Spacing.lg, alignItems: 'center', marginTop: 10, backgroundColor: theme.Colors.glassFill },
  cardTitle: { fontSize: theme.Typography.headlineMd.fontSize, fontWeight: '700', color: theme.Colors.onSurface, marginBottom: 12 },
  cardText: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', marginBottom: theme.Spacing.xl, maxWidth: 500, lineHeight: 22 },
  checklistGrid: { flexDirection: 'row', gap: theme.Spacing.lg, marginBottom: theme.Spacing.lg, width: '100%', justifyContent: 'center' },
  checklistItem: { 
    backgroundColor: isDark ? 'rgba(27, 38, 51, 0.85)' : 'rgba(255, 255, 255, 0.7)', 
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 104, 117, 0.15)',
    padding: theme.Spacing.md, 
    borderRadius: 12, 
    alignItems: 'center', 
    flex: 1, 
    maxWidth: 200 
  },
  checklistLabel: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2, marginBottom: theme.Spacing.sm },
  checklistValue: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.primary },
  statusBox: { flexDirection: 'row', backgroundColor: theme.Colors.secondaryContainer, padding: theme.Spacing.md, borderRadius: 12, marginBottom: theme.Spacing.xl, width: '100%', alignItems: 'center', gap: theme.Spacing.sm },
  statusText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.secondary },
  generateBtn: { width: '100%', maxWidth: 300 },
});
