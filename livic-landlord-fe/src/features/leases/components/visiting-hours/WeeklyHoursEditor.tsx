import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DAYS_OF_WEEK, DayOfWeek, TimeWindow } from '../../api/tourAvailability.api';
import {
  countSlots,
  DAY_LABELS,
  MAX_WINDOWS_PER_DAY,
  nextWindow,
  TIME_OPTIONS,
} from '../../utils/visitingHours';
import { createVisitingHoursStyles } from './VisitingHours.styles';

type WeeklyHoursEditorProps = {
  weeklyHours: Record<DayOfWeek, TimeWindow[]>;
  slotMinutes: number;
  errors: Partial<Record<DayOfWeek, string>>;
  onChangeDay: (day: DayOfWeek, windows: TimeWindow[]) => void;
  onCopyMondayToWeekdays: () => void;
};

/** One row per day: open/closed switch and the day's time ranges. */
export function WeeklyHoursEditor({ weeklyHours, slotMinutes, errors, onChangeDay, onCopyMondayToWeekdays }: WeeklyHoursEditorProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="schedule" size={theme.IconSizes.md} color={theme.Colors.primary} />
          <Text style={styles.cardTitle}>Weekly visiting hours</Text>
        </View>
        <TouchableOpacity
          style={styles.textLink}
          onPress={onCopyMondayToWeekdays}
          accessibilityRole="button"
          accessibilityLabel="Copy Monday's hours to Tuesday to Friday"
        >
          <MaterialIcons name="content-copy" size={theme.IconSizes.sm} color={theme.Colors.primary} />
          <Text style={styles.textLinkLabel}>Copy Monday to weekdays</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardHint}>Visitors can only request a visit inside these hours. Add more than one range to take a break, e.g. 10–1 and 4–7.</Text>

      {DAYS_OF_WEEK.map((day, index) => {
        const windows = weeklyHours[day];
        const isOpen = windows.length > 0;
        const label = DAY_LABELS[day].long;
        const slots = countSlots(windows, slotMinutes);

        const updateWindow = (i: number, patch: Partial<TimeWindow>) =>
          onChangeDay(day, windows.map((w, j) => (j === i ? { ...w, ...patch } : w)));

        return (
          <View key={day} style={[styles.dayRow, index === 0 && styles.dayRowFirst]} testID={`day-row-${day}`}>
            <View style={styles.dayRowHeader}>
              <View style={styles.dayNameRow}>
                <Text style={styles.dayName}>{label}</Text>
                {isOpen ? (
                  <Text style={styles.dayMeta}>{slots === 1 ? '1 slot' : `${slots} slots`}</Text>
                ) : (
                  <Text style={styles.closedText}>Closed</Text>
                )}
              </View>
              <Switch
                value={isOpen}
                onValueChange={(open) => onChangeDay(day, open ? [nextWindow([], slotMinutes)] : [])}
                trackColor={{ false: theme.Colors.surfaceContainerHighest, true: theme.Colors.primary }}
                thumbColor={theme.Colors.surfaceContainerLowest}
                accessibilityLabel={`${label} open for visits`}
              />
            </View>

            {windows.map((window, i) => (
              <View key={`${day}-${i}`} style={styles.windowRow}>
                <View style={styles.timeField}>
                  <GlassDropdown
                    options={TIME_OPTIONS}
                    value={window.start}
                    onChange={(start) => updateWindow(i, { start })}
                    placeholder="Start"
                  />
                </View>
                <Text style={styles.toText}>to</Text>
                <View style={styles.timeField}>
                  <GlassDropdown
                    options={TIME_OPTIONS}
                    value={window.end}
                    onChange={(end) => updateWindow(i, { end })}
                    placeholder="End"
                  />
                </View>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onChangeDay(day, windows.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${label} time range ${i + 1}`}
                >
                  <MaterialIcons name="close" size={theme.IconSizes.sm} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            ))}

            {errors[day] ? <Text style={styles.fieldError}>{errors[day]}</Text> : null}

            {isOpen && windows.length < MAX_WINDOWS_PER_DAY ? (
              <TouchableOpacity
                style={styles.textLink}
                onPress={() => onChangeDay(day, [...windows, nextWindow(windows, slotMinutes)])}
                accessibilityRole="button"
                accessibilityLabel={`Add a time range on ${label}`}
              >
                <MaterialIcons name="add" size={theme.IconSizes.sm} color={theme.Colors.primary} />
                <Text style={styles.textLinkLabel}>Add time range</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </GlassCard>
  );
}
