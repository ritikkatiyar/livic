import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterPill } from '@/src/components/common/inputs/FilterPill';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { ISSUE_PRIORITY_OPTIONS, ISSUE_STATUS_OPTIONS } from '../utils/issueFilters';

interface IssueFiltersSheetProps {
  visible: boolean;
  status: string;
  priority: string;
  onChangeStatus: (status: string) => void;
  onChangePriority: (priority: string) => void;
  onClose: () => void;
}

/**
 * Status and priority filters for the issues list on phones, in one sheet instead of two rows of
 * chips above the list. Choices apply as they are tapped, so the list behind is already filtered.
 */
export function IssueFiltersSheet({ visible, status, priority, onChangeStatus, onChangePriority, onClose }: IssueFiltersSheetProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const hasFilters = status !== 'ALL' || priority !== 'ALL';

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">Filters</Text>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.groupLabel}>Status</Text>
            <View style={styles.options}>
              {ISSUE_STATUS_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  label={option.label}
                  active={status === option.value}
                  onPress={() => onChangeStatus(option.value)}
                />
              ))}
            </View>

            <Text style={styles.groupLabel}>Priority</Text>
            <View style={styles.options}>
              {ISSUE_PRIORITY_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  label={option.label}
                  active={priority === option.value}
                  onPress={() => onChangePriority(option.value)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                onChangeStatus('ALL');
                onChangePriority('ALL');
              }}
              disabled={!hasFilters}
              accessibilityRole="button"
              accessibilityState={{ disabled: !hasFilters }}
            >
              <Text style={[styles.resetText, !hasFilters && styles.resetTextDisabled]}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.Colors.scrim,
    },
    sheet: {
      maxHeight: '80%',
      paddingTop: theme.Spacing.sm,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: theme.Colors.surfaceContainerLowest,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 3,
      marginBottom: theme.Spacing.md,
      backgroundColor: theme.Colors.outlineVariant,
    },
    title: {
      paddingHorizontal: 20,
      fontSize: theme.Typography.titleLarge.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    body: {
      paddingHorizontal: 20,
      paddingBottom: theme.Spacing.md,
    },
    groupLabel: {
      marginTop: 20,
      marginBottom: 10,
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
    },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.Spacing.md,
      paddingHorizontal: 20,
      paddingTop: theme.Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.Colors.outlineVariant,
    },
    resetButton: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: theme.Spacing.sm,
    },
    resetText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.primary,
    },
    resetTextDisabled: {
      color: theme.Colors.onSurfaceVariant,
      opacity: 0.6,
    },
    doneButton: {
      minHeight: 48,
      paddingHorizontal: 28,
      borderRadius: theme.Rounded.full,
      justifyContent: 'center',
      backgroundColor: theme.Colors.primary,
    },
    doneText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onPrimary,
    },
  });
