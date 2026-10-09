import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ConfirmDialog } from '@/src/components/common/feedback/ConfirmDialog';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { timeOptions } from '@/src/utils/weekdays';
import { MealSlot, MealSlotRequest } from '../api/messMenu.api';
import { MAX_SLOT_NAME, MAX_SLOTS, newItemKey, SlotDraft, SUGGESTED_SLOTS, toSlotRequests, validateSlots } from '../utils/messMenu';
import { createMessMenuStyles } from './MessMenu.styles';

const TIME_OPTIONS = [{ label: 'No set time', value: '' }, ...timeOptions(15)];

type MealSlotsModalProps = {
  visible: boolean;
  slots: MealSlot[];
  /** How many dishes each saved slot has across the week, to warn before deleting it. */
  dishCountBySlot: Record<string, number>;
  isSaving: boolean;
  onClose: () => void;
  onSave: (slots: MealSlotRequest[]) => Promise<unknown>;
};

const toRows = (slots: MealSlot[]): SlotDraft[] =>
  slots.map((slot) => ({ key: slot.id, id: slot.id, name: slot.name, startTime: slot.startTime ?? '', endTime: slot.endTime ?? '' }));

/** Add, rename, reorder and remove the meals the mess serves. */
export function MealSlotsModal({ visible, slots, dishCountBySlot, isSaving, onClose, onSave }: MealSlotsModalProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createMessMenuStyles(theme), [theme]);
  const [rows, setRows] = useState<SlotDraft[]>([]);
  const [pendingDelete, setPendingDelete] = useState<SlotDraft | null>(null);

  useEffect(() => {
    if (visible) setRows(toRows(slots));
  }, [visible, slots]);

  const errors = useMemo(() => validateSlots(rows), [rows]);
  const hasErrors = Object.keys(errors).length > 0;

  const update = (key: string, patch: Partial<SlotDraft>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const move = (index: number, by: number) =>
    setRows((prev) => {
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(index + by, 0, row);
      return next;
    });
  const remove = (key: string) => setRows((prev) => prev.filter((row) => row.key !== key));
  const requestRemove = (row: SlotDraft) => {
    if (row.id && dishCountBySlot[row.id]) {
      setPendingDelete(row);
    } else {
      remove(row.key);
    }
  };
  const addRow = () => setRows((prev) => [...prev, { key: newItemKey(), id: null, name: '', startTime: '', endTime: '' }]);
  const applySuggested = () =>
    setRows(SUGGESTED_SLOTS.map((slot) => ({ key: newItemKey(), id: null, name: slot.name, startTime: slot.startTime ?? '', endTime: slot.endTime ?? '' })));

  const handleSave = async () => {
    if (hasErrors) return;
    try {
      await onSave(toSlotRequests(rows));
      onClose();
    } catch {
      // The hook shows the server's message; keep the rows so they can be fixed
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerText}>
              <Text style={styles.modalTitle}>Meals</Text>
              <Text style={styles.cardHint}>The meals your mess serves each day, in order. Times are optional.</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={theme.IconSizes.lg} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {rows.length === 0 ? (
              <ActionButton label="Use Breakfast, Lunch, Snacks and Dinner" icon="auto-awesome" variant="outline" onPress={applySuggested} />
            ) : null}

            {rows.map((row, index) => (
              <View key={row.key} style={[styles.slotRow, index === 0 && styles.slotRowFirst]} testID={`slot-row-${index}`}>
                <View style={styles.slotNameRow}>
                  <TextInput
                    style={[styles.input, styles.addInput, errors[row.key] ? styles.inputError : null]}
                    value={row.name}
                    onChangeText={(name) => update(row.key, { name })}
                    maxLength={MAX_SLOT_NAME}
                    placeholder="Meal name, e.g. Lunch"
                    placeholderTextColor={theme.Colors.placeholder}
                    accessibilityLabel={`Meal ${index + 1} name`}
                  />
                  <TouchableOpacity
                    style={[styles.iconButton, index === 0 && styles.iconButtonDisabled]}
                    disabled={index === 0}
                    onPress={() => move(index, -1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${row.name || 'meal'} up`}
                  >
                    <MaterialIcons name="arrow-upward" size={theme.IconSizes.sm} color={theme.Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, index === rows.length - 1 && styles.iconButtonDisabled]}
                    disabled={index === rows.length - 1}
                    onPress={() => move(index, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${row.name || 'meal'} down`}
                  >
                    <MaterialIcons name="arrow-downward" size={theme.IconSizes.sm} color={theme.Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => requestRemove(row)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${row.name || 'meal'}`}
                  >
                    <MaterialIcons name="delete-outline" size={theme.IconSizes.sm} color={theme.Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.slotTimes}>
                  <View style={styles.timeField}>
                    <GlassDropdown options={TIME_OPTIONS} value={row.startTime} onChange={(startTime) => update(row.key, { startTime })} placeholder="Starts" />
                  </View>
                  <Text style={styles.toText}>to</Text>
                  <View style={styles.timeField}>
                    <GlassDropdown options={TIME_OPTIONS} value={row.endTime} onChange={(endTime) => update(row.key, { endTime })} placeholder="Ends" />
                  </View>
                </View>
                {errors[row.key] ? <Text style={styles.fieldError}>{errors[row.key]}</Text> : null}
              </View>
            ))}

            {rows.length < MAX_SLOTS ? (
              <TouchableOpacity style={styles.textLink} onPress={addRow} accessibilityRole="button" accessibilityLabel="Add a meal">
                <MaterialIcons name="add" size={theme.IconSizes.sm} color={theme.Colors.primary} />
                <Text style={styles.textLinkLabel}>Add a meal</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          <View style={styles.modalActions}>
            <ActionButton label="Cancel" variant="ghost" onPress={onClose} disabled={isSaving} />
            <ActionButton label="Save meals" icon="check" variant="primary" loading={isSaving} disabled={hasErrors || isSaving} onPress={handleSave} />
          </View>
        </View>
      </View>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title={`Remove ${pendingDelete?.name || 'this meal'}?`}
        message={`Its ${dishCountBySlot[pendingDelete?.id ?? ''] ?? 0} dishes across the week will be deleted when you save.`}
        confirmText="Remove"
        isDestructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.key);
          setPendingDelete(null);
        }}
      />
    </Modal>
  );
}
