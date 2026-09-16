import React from 'react';
import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { TourSlots, TourSlotStatus } from '../../api/tourAvailability.api';
import { formatIsoDate, formatTime, toHHmm } from '../../utils/visitingHours';
import { createVisitingHoursStyles } from './VisitingHours.styles';

type SlotPreviewCardProps = {
  preview: TourSlots | null;
  isLoading: boolean;
  /** The form has changes the preview doesn't reflect yet. */
  hasUnsavedChanges: boolean;
};

const PREVIEW_DAYS = 7;

/** What visitors see on the marketplace for the coming week, based on the saved settings. */
export function SlotPreviewCard({ preview, isLoading, hasUnsavedChanges }: SlotPreviewCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);

  const chipStyle = (status: TourSlotStatus) => [
    styles.slotChip,
    status === 'FULL' && styles.slotChipFull,
    status === 'UNAVAILABLE' && styles.slotChipUnavailable,
  ];
  const chipTextStyle = (status: TourSlotStatus) => [
    styles.slotChipText,
    status === 'FULL' && styles.slotChipTextFull,
    status === 'UNAVAILABLE' && styles.slotChipTextUnavailable,
  ];

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="visibility" size={theme.IconSizes.md} color={theme.Colors.primary} />
          <Text style={styles.cardTitle}>What visitors see</Text>
        </View>
      </View>
      <Text style={styles.cardHint}>
        {hasUnsavedChanges ? 'Save your changes to update this preview.' : 'Visit times offered on the marketplace this week.'}
      </Text>

      {isLoading || !preview ? (
        <View style={styles.skeletonStack}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={40} borderRadius={theme.Rounded.md} />
          ))}
        </View>
      ) : (
        <>
          {preview.days.slice(0, PREVIEW_DAYS).map((day, index) => (
            <View key={day.date} style={[styles.previewDay, index === 0 && styles.previewDayFirst]}>
              <Text style={styles.previewDayLabel}>{formatIsoDate(day.date)}</Text>
              {day.closed || day.slots.length === 0 ? (
                <Text style={styles.emptyText}>Closed</Text>
              ) : (
                <View style={styles.slotChips}>
                  {day.slots.map((slot) => (
                    <View key={slot.start} style={chipStyle(slot.status)}>
                      <Text style={chipTextStyle(slot.status)}>{formatTime(toHHmm(slot.localTime))}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={styles.legendRow}>
            <View style={chipStyle('AVAILABLE')}><Text style={chipTextStyle('AVAILABLE')}>Bookable</Text></View>
            <View style={chipStyle('FULL')}><Text style={chipTextStyle('FULL')}>Full</Text></View>
            <View style={chipStyle('UNAVAILABLE')}><Text style={chipTextStyle('UNAVAILABLE')}>Too soon or blocked</Text></View>
          </View>
        </>
      )}
    </GlassCard>
  );
}
