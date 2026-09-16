import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { CreateBlackoutRequest, TourBlackout } from '../../api/tourAvailability.api';
import { formatIsoDate, formatTime, TIME_OPTIONS, toHHmm, toMinutes, upcomingDates } from '../../utils/visitingHours';
import { createVisitingHoursStyles } from './VisitingHours.styles';

type BlockedDatesCardProps = {
  blackouts: TourBlackout[];
  onAdd: (request: CreateBlackoutRequest) => Promise<unknown>;
  isAdding: boolean;
  onDelete: (blackoutId: string) => void;
  deletingId: string | null;
};

const PICKABLE_DAYS = 60;

/** Dates (or parts of a day) when no visits can be booked, e.g. a festival or the landlord being away. */
export function BlockedDatesCard({ blackouts, onAdd, isAdding, onDelete, deletingId }: BlockedDatesCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);

  const dates = useMemo(() => upcomingDates(PICKABLE_DAYS), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [wholeDay, setWholeDay] = useState(true);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [reason, setReason] = useState('');

  const wholeDayBlocked = new Set(blackouts.filter((b) => !b.startTime).map((b) => b.date));
  const rangeInvalid = !wholeDay && toMinutes(endTime) <= toMinutes(startTime);
  const canSubmit = Boolean(selectedDate) && !rangeInvalid && !isAdding;

  const submit = async () => {
    if (!selectedDate || rangeInvalid) return;
    try {
      await onAdd({
        date: selectedDate,
        startTime: wholeDay ? null : startTime,
        endTime: wholeDay ? null : endTime,
        reason: reason.trim() ? reason.trim() : null,
      });
      setSelectedDate(null);
      setReason('');
    } catch {
      // The hook already shows the server's message; keep the form so it can be corrected
    }
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="event-busy" size={theme.IconSizes.md} color={theme.Colors.primary} />
          <Text style={styles.cardTitle}>Blocked dates</Text>
        </View>
      </View>
      <Text style={styles.cardHint}>Pick a date when you can&apos;t show the property. Existing requests on that date stay as they are.</Text>

      <View style={styles.blockForm}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {dates.map((date) => {
            const [, , day] = date.split('-');
            const active = date === selectedDate;
            const blocked = wholeDayBlocked.has(date);
            const label = formatIsoDate(date);
            const [weekday, , month] = label.replace(',', '').split(' ');
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dateChip, blocked && styles.dateChipBlocked, active && styles.dateChipActive]}
                onPress={() => setSelectedDate(active ? null : date)}
                disabled={blocked}
                accessibilityRole="radio"
                accessibilityState={{ checked: active, disabled: blocked }}
                accessibilityLabel={blocked ? `${label}, already blocked` : label}
              >
                <Text style={[styles.dateChipSmall, blocked && styles.dateChipTextBlocked, active && styles.dateChipTextActive]}>{weekday}</Text>
                <Text style={[styles.dateChipDay, blocked && styles.dateChipTextBlocked, active && styles.dateChipTextActive]}>{Number(day)}</Text>
                <Text style={[styles.dateChipSmall, blocked && styles.dateChipTextBlocked, active && styles.dateChipTextActive]}>{month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.dayRowHeader}>
          <Text style={styles.ruleLabel}>Whole day</Text>
          <Switch
            value={wholeDay}
            onValueChange={setWholeDay}
            trackColor={{ false: theme.Colors.surfaceContainerHighest, true: theme.Colors.primary }}
            thumbColor={theme.Colors.surfaceContainerLowest}
            accessibilityLabel="Block the whole day"
          />
        </View>

        {!wholeDay ? (
          <View style={styles.windowRow}>
            <View style={styles.timeField}>
              <GlassDropdown options={TIME_OPTIONS} value={startTime} onChange={setStartTime} placeholder="From" />
            </View>
            <Text style={styles.toText}>to</Text>
            <View style={styles.timeField}>
              <GlassDropdown options={TIME_OPTIONS} value={endTime} onChange={setEndTime} placeholder="To" />
            </View>
          </View>
        ) : null}
        {rangeInvalid ? <Text style={styles.fieldError}>End time must be after the start time</Text> : null}

        <TextInput
          value={reason}
          onChangeText={setReason}
          maxLength={200}
          placeholder="Reason (optional, only you see this)"
          placeholderTextColor={theme.Colors.onSurfaceVariant}
          style={styles.reasonInput}
          accessibilityLabel="Reason for blocking"
        />

        <ActionButton
          label={selectedDate ? `Block ${formatIsoDate(selectedDate)}` : 'Select a date to block'}
          icon="block"
          variant="outline"
          size="sm"
          fullWidth
          loading={isAdding}
          disabled={!canSubmit}
          onPress={submit}
        />
      </View>

      {blackouts.length === 0 ? (
        <Text style={styles.emptyText}>No blocked dates.</Text>
      ) : (
        <View style={styles.blockList}>
          {blackouts.map((b) => (
            <View key={b.id} style={styles.blockItem}>
              <View style={styles.blockItemText}>
                <Text style={styles.blockItemTitle}>{formatIsoDate(b.date)}</Text>
                <Text style={styles.blockItemMeta}>
                  {b.startTime && b.endTime ? `${formatTime(toHHmm(b.startTime))}–${formatTime(toHHmm(b.endTime))}` : 'All day'}
                  {b.reason ? ` · ${b.reason}` : ''}
                </Text>
              </View>
              {deletingId === b.id ? (
                <ActivityIndicator size="small" color={theme.Colors.primary} />
              ) : (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => onDelete(b.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock ${formatIsoDate(b.date)}`}
                >
                  <MaterialIcons name="delete-outline" size={theme.IconSizes.sm} color={theme.Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
