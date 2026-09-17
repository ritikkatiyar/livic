import React from 'react';
import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useTourAvailabilityQuery } from '../../hooks/useTourAvailability';
import { summarizeWeeklyHours, toDraft } from '../../utils/visitingHours';
import { createVisitingHoursStyles } from './VisitingHours.styles';

type VisitingHoursBannerProps = {
  propertyId: string;
  isDesktop: boolean;
};

/** Current visiting hours at the top of the Tours tab, with a way to change them. */
export function VisitingHoursBanner({ propertyId, isDesktop }: VisitingHoursBannerProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);
  const router = useRouter();
  const { data: availability, isLoading } = useTourAvailabilityQuery(propertyId);

  if (isLoading) {
    return <Skeleton height={72} borderRadius={theme.Rounded.lg} />;
  }
  if (!availability) {
    return null;
  }

  const summary = summarizeWeeklyHours(toDraft(availability).weeklyHours);
  const blockedCount = availability.blackouts.length;

  return (
    <View style={[styles.banner, !isDesktop && styles.bannerStacked]} testID="visiting-hours-banner">
      <View style={styles.bannerBody}>
        <View style={styles.bannerIcon}>
          <MaterialIcons name="schedule" size={theme.IconSizes.md} color={theme.Colors.primary} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>
            {availability.customized ? 'Visiting hours' : 'Set your visiting hours'}
          </Text>
          <Text style={styles.bannerSummary}>
            {availability.customized
              ? `${summary} · ${availability.slotMinutes}-min visits${blockedCount ? ` · ${blockedCount} blocked ${blockedCount === 1 ? 'date' : 'dates'}` : ''}`
              : 'Visitors can currently book any day from 9 AM to 8 PM. Choose the times that suit you.'}
          </Text>
        </View>
      </View>
      <ActionButton
        label={availability.customized ? 'Edit hours' : 'Set visiting hours'}
        icon="edit-calendar"
        variant={availability.customized ? 'outline' : 'primary'}
        size="sm"
        fullWidth={!isDesktop}
        onPress={() => router.push(`/properties/${propertyId}/visiting-hours`)}
      />
    </View>
  );
}
