import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import type { PropertyResponse } from '@/src/types/property';

interface AnnouncementComposerProps {
  properties: PropertyResponse[];
  selectedPropertyId: string | null;
  setSelectedPropertyId: (val: string | null) => void;
  broadcastTitle: string;
  setBroadcastTitle: (val: string) => void;
  broadcastContent: string;
  setBroadcastContent: (val: string) => void;
  broadcastCategory: 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT';
  setBroadcastCategory: (val: 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT') => void;
  broadcastSeverity: 'INFO' | 'WARNING' | 'CRITICAL';
  setBroadcastSeverity: (val: 'INFO' | 'WARNING' | 'CRITICAL') => void;
  broadcastTargetType: 'PROPERTY' | 'FLOOR' | 'UNIT';
  setBroadcastTargetType: (val: 'PROPERTY' | 'FLOOR' | 'UNIT') => void;
  broadcastTargetValue: string;
  setBroadcastTargetValue: (val: string) => void;
  sendingBroadcast: boolean;
  handleSendBroadcast: () => void;
}

export function AnnouncementComposer({
  properties,
  selectedPropertyId,
  setSelectedPropertyId,
  broadcastTitle,
  setBroadcastTitle,
  broadcastContent,
  setBroadcastContent,
  broadcastCategory,
  setBroadcastCategory,
  broadcastSeverity,
  setBroadcastSeverity,
  broadcastTargetType,
  setBroadcastTargetType,
  broadcastTargetValue,
  setBroadcastTargetValue,
  sendingBroadcast,
  handleSendBroadcast,
}: AnnouncementComposerProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeader}>NEW BROADCAST NOTICE</Text>



      {/* Title */}
      <Text style={styles.composerLabel}>TITLE</Text>
      <TextInput
        style={styles.composerInput}
        placeholder="e.g. Water supply maintenance shutdown"
        placeholderTextColor="#a0aab2"
        value={broadcastTitle}
        onChangeText={setBroadcastTitle}
        maxLength={255}
      />

      {/* Content */}
      <Text style={styles.composerLabel}>CONTENT MESSAGE</Text>
      <TextInput
        style={[styles.composerInput, styles.composerTextarea]}
        placeholder="Write detail notice instructions..."
        placeholderTextColor="#a0aab2"
        value={broadcastContent}
        onChangeText={setBroadcastContent}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      {/* Category Row */}
      <Text style={styles.composerLabel}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
        {(['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const).map(cat => (
          <FilterPill
            key={cat}
            label={cat}
            active={broadcastCategory === cat}
            onPress={() => setBroadcastCategory(cat)}
            size="sm"
          />
        ))}
      </ScrollView>

      {/* Severity Row */}
      <Text style={styles.composerLabel}>SEVERITY LEVEL</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
        {(['INFO', 'WARNING', 'CRITICAL'] as const).map((val) => (
          <FilterPill
            key={val}
            label={val}
            active={broadcastSeverity === val}
            onPress={() => setBroadcastSeverity(val)}
            size="sm"
          />
        ))}
      </ScrollView>

      {/* Target Scope Row */}
      <Text style={styles.composerLabel}>TARGET SCOPE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
        {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map(t => (
          <FilterPill
            key={t}
            label={t}
            active={broadcastTargetType === t}
            onPress={() => setBroadcastTargetType(t)}
            size="sm"
          />
        ))}
      </ScrollView>

      {broadcastTargetType !== 'PROPERTY' && (
        <>
          <Text style={styles.composerLabel}>
            {broadcastTargetType === 'FLOOR' ? 'FLOOR NUMBER' : 'UNIT ID'}
          </Text>
          <TextInput
            style={styles.composerInput}
            placeholder={broadcastTargetType === 'FLOOR' ? 'e.g. 3' : 'e.g. uuid of unit'}
            placeholderTextColor="#a0aab2"
            value={broadcastTargetValue}
            onChangeText={setBroadcastTargetValue}
            keyboardType={broadcastTargetType === 'FLOOR' ? 'numeric' : 'default'}
          />
        </>
      )}

      <ActionButton
        label="BROADCAST NOW"
        icon="send"
        variant={broadcastSeverity === 'CRITICAL' ? 'danger' : 'primary'}
        size="lg"
        fullWidth
        loading={sendingBroadcast}
        disabled={sendingBroadcast}
        onPress={handleSendBroadcast}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    padding: theme.Spacing.lg,
    borderRadius: 16,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  composerLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: theme.Spacing.sm,
    marginTop: 18,
  },
  composerInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    paddingHorizontal: theme.Spacing.md,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  composerTextarea: {
    height: 120,
    paddingVertical: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: theme.Spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: theme.Spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.Colors.glassStroke,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    marginRight: theme.Spacing.sm,
  },
  chipActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  chipText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: theme.Colors.surfaceContainerLowest,
  },
  composerSendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 28,
  },
  composerSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  composerSendText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
