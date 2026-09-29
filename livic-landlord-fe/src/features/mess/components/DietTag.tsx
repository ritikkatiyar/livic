import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DietType } from '../api/messMenu.api';
import { DIET_LABELS, DIET_TYPES } from '../utils/messMenu';
import { createMessMenuStyles, dietColor } from './MessMenu.styles';

/** The square-and-dot mark Indian menus use: green for veg, amber for egg, red for non-veg. */
export function DietMark({ diet }: { diet: DietType }) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);
  const color = dietColor(theme, diet);
  return (
    <View style={[styles.dietMark, { borderColor: color }]} accessibilityLabel={DIET_LABELS[diet]}>
      <View style={[styles.dietMarkDot, { backgroundColor: color }]} />
    </View>
  );
}

type DietTagPickerProps = {
  value: DietType | null;
  onChange: (value: DietType | null) => void;
  itemName: string;
};

/** Veg / Egg / Non-veg chips; tapping the chosen one again clears the mark. */
export function DietTagPicker({ value, onChange, itemName }: DietTagPickerProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);

  return (
    <View style={styles.dietPicker} accessibilityRole="radiogroup">
      {DIET_TYPES.map((diet) => {
        const selected = value === diet;
        const color = dietColor(theme, diet);
        return (
          <TouchableOpacity
            key={diet}
            style={[styles.dietChip, selected && { borderColor: color, backgroundColor: theme.Colors.surfaceContainerLow }]}
            onPress={() => onChange(selected ? null : diet)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${itemName || 'Dish'}: ${DIET_LABELS[diet]}`}
          >
            <DietMark diet={diet} />
            <Text style={[styles.dietChipText, selected && { color }]}>{DIET_LABELS[diet]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
