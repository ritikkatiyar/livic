import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DayOfWeek, TimeWindow } from '../api/tourAvailability.api';
import { BlockedDatesCard } from '../components/visiting-hours/BlockedDatesCard';
import { BookingRulesCard } from '../components/visiting-hours/BookingRulesCard';
import { SlotPreviewCard } from '../components/visiting-hours/SlotPreviewCard';
import { createVisitingHoursStyles } from '../components/visiting-hours/VisitingHours.styles';
import { WeeklyHoursEditor } from '../components/visiting-hours/WeeklyHoursEditor';
import { useTourAvailability } from '../hooks/useTourAvailability';
import {
  copyMondayToWeekdays,
  isDraftEqual,
  toDraft,
  toUpdateRequest,
  validateDraft,
  VisitingHoursDraft,
} from '../utils/visitingHours';

type VisitingHoursScreenProps = {
  propertyId: string;
};

/** Landlord settings for when marketplace visitors can request a property tour. */
export default function VisitingHoursScreen({ propertyId }: VisitingHoursScreenProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createVisitingHoursStyles(theme), [theme]);
  const router = useRouter();
  const { isDesktop, isMobile } = useResponsive();
  const { handleScroll } = useScrollNav();
  const { properties } = useProperties();
  const propertyName = properties.find((p) => p.id === propertyId)?.name;

  const {
    availability, isLoading, error, refetch,
    preview, isPreviewLoading,
    save, isSaving,
    addBlackout, isAddingBlackout,
    deleteBlackout, deletingBlackoutId,
  } = useTourAvailability(propertyId);

  // Local edits; null until the landlord changes something, so the form always starts from the saved settings
  const [edits, setEdits] = useState<VisitingHoursDraft | null>(null);
  const saved = useMemo(() => (availability ? toDraft(availability) : null), [availability]);
  const draft = edits ?? saved;

  const errors = useMemo(() => (draft ? validateDraft(draft) : {}), [draft]);
  const hasErrors = Object.keys(errors).length > 0;
  const isDirty = Boolean(edits && saved && !isDraftEqual(edits, saved));

  // Functional updates: two quick changes in a row must not drop the first one
  const update = (patch: Partial<VisitingHoursDraft>) => {
    setEdits((prev) => {
      const current = prev ?? saved;
      return current ? { ...current, ...patch } : null;
    });
  };
  const changeDay = (day: DayOfWeek, windows: TimeWindow[]) => {
    setEdits((prev) => {
      const current = prev ?? saved;
      return current ? { ...current, weeklyHours: { ...current.weeklyHours, [day]: windows } } : null;
    });
  };

  const handleSave = async () => {
    if (!draft || hasErrors) return;
    try {
      await save(toUpdateRequest(draft));
      setEdits(null);
    } catch {
      // The hook shows the server's message; keep the edits so they can be fixed
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/leases?tab=tours'));

  const saveButton = (
    <ActionButton
      label={isDirty ? 'Save changes' : 'Saved'}
      icon={isDirty ? 'check' : 'check-circle'}
      variant="primary"
      size={isDesktop ? 'md' : 'lg'}
      fullWidth={!isDesktop}
      loading={isSaving}
      disabled={!isDirty || hasErrors || isSaving}
      onPress={handleSave}
    />
  );

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      onScroll={handleScroll}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <TouchableOpacity style={styles.backLink} onPress={goBack} accessibilityRole="link" accessibilityLabel="Back to tour requests">
            <MaterialIcons name="arrow-back" size={theme.IconSizes.sm} color={theme.Colors.primary} />
            <Text style={styles.backLinkText}>Tour requests</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>{propertyName ? `MARKETPLACE TOURS · ${propertyName.toUpperCase()}` : 'MARKETPLACE TOURS'}</Text>
          <Text style={styles.title}>Visiting hours</Text>
          <Text style={styles.subtitle}>Choose when visitors can request a property tour.</Text>
        </View>
        {isDesktop && draft ? (
          <View style={styles.headerActions}>
            {isDirty ? <Text style={styles.unsavedText}>Unsaved changes</Text> : null}
            {saveButton}
          </View>
        ) : null}
      </View>

      {error && !availability ? (
        <EmptyState
          iconName="error-outline"
          title="Couldn't load visiting hours"
          description={error.message || 'Please try again.'}
          actionText="Try again"
          onAction={() => refetch()}
        />
      ) : isLoading || !draft || !availability ? (
        <View style={styles.skeletonStack} accessibilityLabel="Loading visiting hours">
          <Skeleton height={64} borderRadius={theme.Rounded.md} />
          <Skeleton height={420} borderRadius={theme.Rounded.xl} />
        </View>
      ) : (
        <>
          {!availability.customized ? (
            <View style={styles.notice}>
              <MaterialIcons name="info-outline" size={theme.IconSizes.md} color={theme.Colors.onPrimaryContainer} />
              <Text style={styles.noticeText}>
                You&apos;re using the default hours: visitors can book any day from 9 AM to 8 PM. Adjust them below and save to make them your own.
              </Text>
            </View>
          ) : null}

          <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
            <View style={[styles.mainColumn, isDesktop && styles.mainColumnDesktop]}>
              <WeeklyHoursEditor
                weeklyHours={draft.weeklyHours}
                slotMinutes={draft.slotMinutes}
                errors={errors}
                onChangeDay={changeDay}
                onCopyMondayToWeekdays={() => setEdits((prev) => copyMondayToWeekdays(prev ?? draft))}
              />
              <BookingRulesCard draft={draft} isWide={!isMobile} onChange={update} />
            </View>
            <View style={[styles.sideColumn, isDesktop && styles.sideColumnDesktop]}>
              <BlockedDatesCard
                blackouts={availability.blackouts}
                onAdd={addBlackout}
                isAdding={isAddingBlackout}
                onDelete={deleteBlackout}
                deletingId={deletingBlackoutId}
              />
              <SlotPreviewCard preview={preview} isLoading={isPreviewLoading} hasUnsavedChanges={isDirty} />
            </View>
          </View>

          {!isDesktop ? (
            <View style={styles.mobileSave}>
              {isDirty ? <Text style={styles.unsavedText}>Unsaved changes</Text> : null}
              {hasErrors ? <Text style={styles.fieldError}>Fix the highlighted days before saving.</Text> : null}
              {saveButton}
            </View>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
