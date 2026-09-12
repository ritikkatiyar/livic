import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { PropertyResponse } from '@/src/types/property';

interface BroadcastComposerModalProps {
  visible: boolean;
  selectedPropertyForBroadcast: PropertyResponse | null;
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
  onClose: () => void;
}

export function BroadcastComposerModal({
  visible,
  selectedPropertyForBroadcast,
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
  onClose
}: BroadcastComposerModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.composerOverlay}>
        <View style={styles.composerSheet}>
          {/* Header */}
          <View style={styles.composerHeader}>
            <View>
              <Text style={styles.composerTitle}>Broadcast Notice</Text>
              <Text style={styles.composerSubtitle}>{selectedPropertyForBroadcast?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.composerScroll}>
            {/* Title */}
            <Text style={styles.composerLabel}>TITLE</Text>
            <TextInput
              style={styles.composerInput}
              placeholder="e.g. Water supply shut-off notice"
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
              maxLength={255}
            />

            {/* Content */}
            <Text style={styles.composerLabel}>CONTENT</Text>
            <TextInput
              style={[styles.composerInput, styles.composerTextarea]}
              placeholder="Describe the notice in detail..."
              value={broadcastContent}
              onChangeText={setBroadcastContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Category row */}
            <Text style={styles.composerLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, broadcastCategory === cat && styles.chipActive]}
                  onPress={() => setBroadcastCategory(cat)}
                >
                  <Text style={[styles.chipText, broadcastCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Severity row */}
            <Text style={styles.composerLabel}>SEVERITY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {[
                { val: 'INFO' as const, color: theme.Colors.primary },
                { val: 'WARNING' as const, color: theme.Colors.tertiary },
                { val: 'CRITICAL' as const, color: theme.Colors.error },
              ].map(({ val, color }) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, broadcastSeverity === val && { ...styles.chipActive, backgroundColor: color, borderColor: color }]}
                  onPress={() => setBroadcastSeverity(val)}
                >
                  <Text style={[styles.chipText, broadcastSeverity === val && styles.chipTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Target scope row */}
            <Text style={styles.composerLabel}>TARGET SCOPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, broadcastTargetType === t && styles.chipActive]}
                  onPress={() => setBroadcastTargetType(t)}
                >
                  <Text style={[styles.chipText, broadcastTargetType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
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
                  value={broadcastTargetValue}
                  onChangeText={setBroadcastTargetValue}
                  keyboardType={broadcastTargetType === 'FLOOR' ? 'numeric' : 'default'}
                />
              </>
            )}
          </ScrollView>

          {/* Send button */}
          <TouchableOpacity
            style={styles.composerSendBtn}
            onPress={handleSendBroadcast}
            disabled={sendingBroadcast}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.composerSendGradient,
                { backgroundColor: broadcastSeverity === 'CRITICAL' ? theme.Colors.error : theme.Colors.primary }
              ]}
            >
              {sendingBroadcast ? (
                <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.composerSendText}>BROADCAST NOW</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  composerOverlay: {
    flex: 1,
    backgroundColor: theme.Colors.modalOverlayBackground || theme.Colors.scrim || 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  composerSheet: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  composerTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  composerSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  composerScroll: {
    marginBottom: 20,
  },
  composerLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
  },
  composerInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    paddingHorizontal: theme.Spacing.md,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  composerTextarea: {
    minHeight: 110,
    height: 110,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: theme.Spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    marginRight: 6,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  composerSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  composerSendText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
