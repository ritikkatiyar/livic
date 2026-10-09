import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DayOfWeek } from '@/src/utils/weekdays';
import { MealSlot } from '../api/messMenu.api';
import { dayLabel, DraftDay, DraftItem, MAX_NOTE } from '../utils/messMenu';
import { MealSlotCard } from './MealSlotCard';
import { createMessMenuStyles } from './MessMenu.styles';

type DayMenuEditorProps = {
  day: DayOfWeek;
  draftDay: DraftDay;
  slots: MealSlot[];
  error?: string;
  readOnly: boolean;
  onChange: (patch: Partial<DraftDay>) => void;
};

/** The chosen day: its note and a card per meal. */
export function DayMenuEditor({ day, draftDay, slots, error, readOnly, onChange }: DayMenuEditorProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);
  const label = dayLabel(day);

  const changeMeal = (slotId: string, items: DraftItem[]) =>
    onChange({ items: { ...draftDay.items, [slotId]: items } });

  return (
    <View testID={`day-editor-${day}`}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{label}</Text>
        {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      </View>

      {readOnly ? (
        draftDay.note ? (
          <View style={styles.noteBanner}>
            <MaterialIcons name="info-outline" size={theme.IconSizes.md} color={theme.Colors.onTertiaryContainer} />
            <Text style={styles.noteBannerText}>{draftDay.note}</Text>
          </View>
        ) : null
      ) : (
        <View style={styles.dayHeader}>
          <Text style={styles.fieldLabel}>Note for {label} (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={draftDay.note}
            onChangeText={(note) => onChange({ note })}
            maxLength={MAX_NOTE}
            multiline
            placeholder="e.g. Special: veg biryani, or Mess closed for Diwali"
            placeholderTextColor={theme.Colors.onSurfaceVariant}
            accessibilityLabel={`Note for ${label}`}
          />
        </View>
      )}

      <View style={styles.meals}>
        {slots.map((slot) => (
          <MealSlotCard
            key={slot.id}
            slot={slot}
            items={draftDay.items[slot.id] ?? []}
            readOnly={readOnly}
            onChange={(items) => changeMeal(slot.id, items)}
          />
        ))}
      </View>
    </View>
  );
}
