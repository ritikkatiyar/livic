import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useAppTheme } from '@/src/theme/ThemeContext';
import {
  BOOKING_WINDOW_OPTIONS,
  MAX_VISITORS_OPTIONS,
  MIN_NOTICE_OPTIONS,
  SLOT_LENGTH_OPTIONS,
  VisitingHoursDraft,
} from '../../utils/visitingHours';
import { createVisitingHoursStyles } from './VisitingHours.styles';

type BookingRulesCardProps = {
  draft: VisitingHoursDraft;
  isWide: boolean;
  onChange: (patch: Partial<VisitingHoursDraft>) => void;
};

const NO_LIMIT = 'none';

function Segmented<T extends number>({ options, value, onChange, format, label }: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
  label: string;
}) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={format(option)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{format(option)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Slot length, how far ahead and how soon visitors can book, and how many visitors share a slot. */
export function BookingRulesCard({ draft, isWide, onChange }: BookingRulesCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="tune" size={theme.IconSizes.md} color={theme.Colors.primary} />
          <Text style={styles.cardTitle}>Booking rules</Text>
        </View>
      </View>

      <View style={[styles.rulesGrid, isWide && styles.rulesGridWide]}>
        <View style={[styles.ruleGroup, isWide && styles.rulesGridItem]}>
          <Text style={styles.ruleLabel}>Visit length</Text>
          <Segmented
            label="Visit length"
            options={SLOT_LENGTH_OPTIONS}
            value={draft.slotMinutes as (typeof SLOT_LENGTH_OPTIONS)[number]}
            onChange={(slotMinutes) => onChange({ slotMinutes })}
            format={(m) => `${m} min`}
          />
        </View>
        <View style={[styles.ruleGroup, isWide && styles.rulesGridItem]}>
          <Text style={styles.ruleLabel}>Visitors can book up to</Text>
          <Segmented
            label="Booking window"
            options={BOOKING_WINDOW_OPTIONS}
            value={draft.bookingWindowDays as (typeof BOOKING_WINDOW_OPTIONS)[number]}
            onChange={(bookingWindowDays) => onChange({ bookingWindowDays })}
            format={(d) => `${d} days`}
          />
        </View>
      </View>

      <View style={[styles.rulesGrid, isWide && styles.rulesGridWide]}>
        <View style={[styles.ruleGroup, isWide && styles.rulesGridItem]}>
          <Text style={styles.ruleLabel}>Minimum notice</Text>
          <GlassDropdown
            options={MIN_NOTICE_OPTIONS.map((o) => ({ label: o.label, value: String(o.value) }))}
            value={String(draft.minNoticeMinutes)}
            onChange={(value) => onChange({ minNoticeMinutes: Number(value) })}
            icon="hourglass-empty"
          />
          <Text style={styles.ruleHelp}>How soon before a visit it can still be requested.</Text>
        </View>
        <View style={[styles.ruleGroup, isWide && styles.rulesGridItem]}>
          <Text style={styles.ruleLabel}>Visitors per slot</Text>
          <GlassDropdown
            options={MAX_VISITORS_OPTIONS.map((o) => ({ label: o.label, value: o.value === null ? NO_LIMIT : String(o.value) }))}
            value={draft.maxVisitorsPerSlot === null ? NO_LIMIT : String(draft.maxVisitorsPerSlot)}
            onChange={(value) => onChange({ maxVisitorsPerSlot: value === NO_LIMIT ? null : Number(value) })}
            icon="groups"
          />
          <Text style={styles.ruleHelp}>Pending and approved visits count. A full slot can&apos;t be requested.</Text>
        </View>
      </View>

      <Text style={styles.timezoneText}>Times are in the property&apos;s timezone ({draft.timezone}).</Text>
    </GlassCard>
  );
}
