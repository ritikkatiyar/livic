import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useMyMessMenu } from '../hooks/useMyMessMenu';
import { DAY_LABELS, mealsForDay, todayDayOfWeek } from '../utils/messMenu';
import { DayMenuView } from './DayMenuView';
import { createMessMenuStyles } from './MessMenu.styles';

/**
 * Today's meals on the home screen. Secondary content: it stays hidden while loading, on error, and
 * when the resident's property doesn't show a mess menu.
 */
export function TodayMenuCard({ token }: { token: string }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { data: menu } = useMyMessMenu(token);

  if (!menu?.enabled || menu.slots.length === 0) {
    return null;
  }

  const today = todayDayOfWeek();
  const hasDishes = mealsForDay(menu, today).some((meal) => meal.items.length > 0);

  return (
    <View style={styles.card} testID="today-menu-card">
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Today&apos;s menu</Text>
          <Text style={styles.cardSub}>{DAY_LABELS[today].long} at the mess</Text>
        </View>
        <MaterialIcons name="restaurant-menu" size={theme.IconSizes.lg} color={theme.Colors.primary} />
      </View>

      {hasDishes ? (
        <DayMenuView menu={menu} day={today} hideEmptyMeals />
      ) : (
        <Text style={styles.emptyText}>Nothing on the menu for today yet.</Text>
      )}

      <TouchableOpacity
        style={styles.link}
        onPress={() => router.push('/tenant-mess' as Href)}
        accessibilityRole="link"
        accessibilityLabel="See the full week's menu"
      >
        <Text style={styles.linkText}>See full week</Text>
        <MaterialIcons name="arrow-forward" size={theme.IconSizes.sm} color={theme.Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}
