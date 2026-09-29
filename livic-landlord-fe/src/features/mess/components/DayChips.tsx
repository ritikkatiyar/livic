import React from 'react';
import { ScrollView } from 'react-native';
import { FilterPill } from '@/src/components/common/inputs/FilterPill';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DAY_LABELS, DAYS_OF_WEEK, DayOfWeek } from '@/src/utils/weekdays';
import { createMessMenuStyles } from './MessMenu.styles';

type DayChipsProps = {
  selected: DayOfWeek;
  today: DayOfWeek;
  /** Days with something to fix before saving. */
  errorDays: DayOfWeek[];
  dishCounts: Record<DayOfWeek, number>;
  onSelect: (day: DayOfWeek) => void;
};

export function DayChips({ selected, today, errorDays, dishCounts, onSelect }: DayChipsProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
      {DAYS_OF_WEEK.map((day) => (
        <FilterPill
          key={day}
          label={day === today ? `${DAY_LABELS[day].short} · Today` : DAY_LABELS[day].short}
          active={day === selected}
          onPress={() => onSelect(day)}
          icon={errorDays.includes(day) ? 'error-outline' : undefined}
          count={dishCounts[day] || undefined}
          size="sm"
        />
      ))}
    </ScrollView>
  );
}
