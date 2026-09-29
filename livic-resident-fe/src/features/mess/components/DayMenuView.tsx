import React from 'react';
import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DayOfWeek, MessMenu } from '../api/messMenu.api';
import { dayMenu, formatSlotTime, mealsForDay } from '../utils/messMenu';
import { DietDot } from './DietDot';
import { createMessMenuStyles } from './MessMenu.styles';

type DayMenuViewProps = {
  menu: MessMenu;
  day: DayOfWeek;
  /** Hide meals with nothing on them, e.g. on the compact home card. */
  hideEmptyMeals?: boolean;
};

/** A day's note and each meal with its dishes. Names wrap rather than being cut off. */
export function DayMenuView({ menu, day, hideEmptyMeals = false }: DayMenuViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme, isDark), [theme, isDark]);
  const note = dayMenu(menu, day)?.note;
  const meals = mealsForDay(menu, day).filter((meal) => !hideEmptyMeals || meal.items.length > 0);

  return (
    <View style={styles.meals} testID={`day-menu-${day}`}>
      {note ? (
        <View style={styles.noteBanner}>
          <MaterialIcons name="info-outline" size={theme.IconSizes.md} color={theme.Colors.onTertiaryContainer} />
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ) : null}

      {meals.map(({ slot, items }) => {
        const time = formatSlotTime(slot);
        return (
          <View key={slot.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealName}>{slot.name}</Text>
              {time ? <Text style={styles.mealTime}>{time}</Text> : null}
            </View>
            {items.length === 0 ? <Text style={styles.emptyText}>Not on the menu</Text> : null}
            {items.map((item) => (
              <View key={item.id} style={styles.item}>
                {item.dietType ? <DietDot diet={item.dietType} /> : null}
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
