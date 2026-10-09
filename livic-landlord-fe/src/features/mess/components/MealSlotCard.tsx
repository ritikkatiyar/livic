import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { MealSlot } from '../api/messMenu.api';
import { DraftItem, formatSlotTime, MAX_ITEM_NAME, MAX_ITEMS_PER_MEAL, newItemKey } from '../utils/messMenu';
import { DietMark, DietTagPicker } from './DietTag';
import { createMessMenuStyles } from './MessMenu.styles';

type MealSlotCardProps = {
  slot: MealSlot;
  items: DraftItem[];
  readOnly: boolean;
  onChange: (items: DraftItem[]) => void;
};

/** One meal on the chosen day: its dishes, each with a veg / egg / non-veg mark. */
export function MealSlotCard({ slot, items, readOnly, onChange }: MealSlotCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);
  const [newDish, setNewDish] = useState('');
  const time = formatSlotTime(slot);
  const canAdd = items.length < MAX_ITEMS_PER_MEAL;

  const addDish = () => {
    const name = newDish.trim();
    if (!name || !canAdd) return;
    onChange([...items, { key: newItemKey(), name, dietType: null }]);
    setNewDish('');
  };
  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  return (
    <View style={styles.mealCard} testID={`meal-${slot.name}`}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{slot.name}</Text>
        {time ? <Text style={styles.mealTime}>{time}</Text> : null}
      </View>

      {items.length === 0 ? <Text style={styles.emptyText}>Nothing added yet</Text> : null}

      {items.map((item) =>
        readOnly ? (
          <View key={item.key} style={styles.readOnlyItem}>
            {item.dietType ? <DietMark diet={item.dietType} /> : null}
            <Text style={styles.itemNameText}>{item.name}</Text>
          </View>
        ) : (
          <View key={item.key} style={styles.itemBlock}>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, styles.addInput, !item.name.trim() && styles.inputError]}
                value={item.name}
                onChangeText={(name) => updateItem(item.key, { name })}
                maxLength={MAX_ITEM_NAME}
                placeholder="Dish name"
                placeholderTextColor={theme.Colors.placeholder}
                accessibilityLabel={`${slot.name} dish name`}
              />
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => onChange(items.filter((other) => other.key !== item.key))}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name || 'dish'} from ${slot.name}`}
              >
                <MaterialIcons name="close" size={theme.IconSizes.sm} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <DietTagPicker value={item.dietType} onChange={(dietType) => updateItem(item.key, { dietType })} itemName={item.name} />
          </View>
        ),
      )}

      {!readOnly && canAdd ? (
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, styles.addInput]}
            value={newDish}
            onChangeText={setNewDish}
            onSubmitEditing={addDish}
            maxLength={MAX_ITEM_NAME}
            placeholder={`Add a dish to ${slot.name}`}
            placeholderTextColor={theme.Colors.placeholder}
            returnKeyType="done"
            blurOnSubmit={false}
            accessibilityLabel={`New dish for ${slot.name}`}
          />
          <TouchableOpacity
            style={[styles.iconButton, !newDish.trim() && styles.iconButtonDisabled]}
            onPress={addDish}
            disabled={!newDish.trim()}
            accessibilityRole="button"
            accessibilityLabel={`Add dish to ${slot.name}`}
          >
            <MaterialIcons name="add" size={theme.IconSizes.md} color={theme.Colors.primary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
