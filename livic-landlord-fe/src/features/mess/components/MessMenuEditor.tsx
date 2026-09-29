import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DAYS_OF_WEEK, DayOfWeek, todayDayOfWeek } from '@/src/utils/weekdays';
import { useMessMenu } from '../hooks/useMessMenu';
import { copyDay, countDishes, dayLabel, DraftDay, isDraftEqual, MessMenuDraft, toDraft, toWeekRequest, validateDraft } from '../utils/messMenu';
import { CopyDayModal } from './CopyDayModal';
import { DayChips } from './DayChips';
import { DayMenuEditor } from './DayMenuEditor';
import { MealSlotsModal } from './MealSlotsModal';
import { MessEnabledCard } from './MessEnabledCard';
import { MessMenuHeader } from './MessMenuHeader';
import { createMessMenuStyles } from './MessMenu.styles';

type MessMenuEditorProps = {
  propertyId: string;
  propertyName?: string;
};

/**
 * One property's weekly menu. Rendered with `key={propertyId}`, so switching property starts a fresh draft.
 * Staff without MESS_MANAGE see it read-only.
 */
export function MessMenuEditor({ propertyId, propertyName }: MessMenuEditorProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createMessMenuStyles(theme), [theme]);
  const { isDesktop } = useResponsive();
  const { can } = usePermissions();
  const canManage = can('MESS_MANAGE', propertyId);

  const { menu, isLoading, error, refetch, setEnabled, isTogglingEnabled, saveSlots, isSavingSlots, saveWeek, isSavingWeek } =
    useMessMenu(propertyId);

  const today = todayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);
  const [isSlotsOpen, setSlotsOpen] = useState(false);
  const [isCopyOpen, setCopyOpen] = useState(false);

  // Local edits; null until the admin changes something, so the form always starts from the saved week
  const [edits, setEdits] = useState<MessMenuDraft | null>(null);
  const saved = useMemo(() => (menu ? toDraft(menu) : null), [menu]);
  const draft = edits ?? saved;
  const slots = useMemo(() => menu?.slots ?? [], [menu]);

  const errors = useMemo(() => (draft ? validateDraft(draft, slots) : {}), [draft, slots]);
  const errorDays = Object.keys(errors) as DayOfWeek[];
  const isDirty = Boolean(edits && saved && !isDraftEqual(edits, saved, slots));

  const dishCountBySlot = useMemo(() => {
    const counts: Record<string, number> = {};
    menu?.days.forEach((day) => day.meals.forEach((meal) => {
      counts[meal.slotId] = (counts[meal.slotId] ?? 0) + meal.items.length;
    }));
    return counts;
  }, [menu]);
  const dishCounts = useMemo(
    () => Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, draft ? countDishes(draft[day], slots) : 0])) as Record<DayOfWeek, number>,
    [draft, slots],
  );

  // Functional updates: two quick changes in a row must not drop the first one
  const changeDay = (day: DayOfWeek, patch: Partial<DraftDay>) =>
    setEdits((prev) => {
      const current = prev ?? saved;
      return current ? { ...current, [day]: { ...current[day], ...patch } } : null;
    });

  const handleSave = async () => {
    if (!draft || errorDays.length > 0) return;
    try {
      await saveWeek(toWeekRequest(draft, slots));
      setEdits(null);
    } catch {
      // The hook shows the server's message; keep the edits so they can be fixed
    }
  };

  const saveButton = canManage && slots.length > 0 ? (
    <ActionButton
      label={isDirty ? 'Save menu' : 'Saved'}
      icon={isDirty ? 'check' : 'check-circle'}
      variant="primary"
      size={isDesktop ? 'md' : 'lg'}
      fullWidth={!isDesktop}
      loading={isSavingWeek}
      disabled={!isDirty || errorDays.length > 0 || isSavingWeek}
      onPress={handleSave}
    />
  ) : null;

  const header = (
    <MessMenuHeader propertyName={propertyName}>
      {isDesktop && draft ? (
        <>
          {isDirty ? <Text style={styles.unsavedText}>Unsaved changes</Text> : null}
          {saveButton}
        </>
      ) : null}
    </MessMenuHeader>
  );

  if (error && !menu) {
    return (
      <>
        {header}
        <EmptyState
          iconName="error-outline"
          title="Couldn't load the mess menu"
          description={error.message || 'Please try again.'}
          actionText="Try again"
          onAction={() => refetch()}
        />
      </>
    );
  }

  if (isLoading || !menu || !draft) {
    return (
      <>
        {header}
        <View style={styles.skeletonStack} accessibilityLabel="Loading mess menu">
          <Skeleton height={72} borderRadius={theme.Rounded.xl} />
          <Skeleton height={420} borderRadius={theme.Rounded.xl} />
        </View>
      </>
    );
  }

  return (
    <>
      {header}

      {!canManage ? (
        <View style={styles.readOnlyNotice}>
          <MaterialIcons name="lock-outline" size={theme.IconSizes.md} color={theme.Colors.onPrimaryContainer} />
          <Text style={styles.readOnlyText}>You can view this menu. Ask the owner for mess access to change it.</Text>
        </View>
      ) : null}

      <MessEnabledCard enabled={menu.enabled} disabled={!canManage || isTogglingEnabled} onChange={setEnabled} />

      {slots.length === 0 ? (
        <EmptyState
          iconName="restaurant-menu"
          title="Set up your meals first"
          description="Add the meals your mess serves, like Breakfast, Lunch and Dinner. Then fill in what's served each day."
          actionText={canManage ? 'Set up meals' : undefined}
          onAction={canManage ? () => setSlotsOpen(true) : undefined}
        />
      ) : (
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialIcons name="restaurant-menu" size={theme.IconSizes.md} color={theme.Colors.primary} />
              <Text style={styles.cardTitle}>Weekly menu</Text>
            </View>
            {canManage ? (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.textLink} onPress={() => setCopyOpen(true)} accessibilityRole="button">
                  <MaterialIcons name="content-copy" size={theme.IconSizes.sm} color={theme.Colors.primary} />
                  <Text style={styles.textLinkLabel}>Copy {dayLabel(selectedDay)} to…</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.textLink} onPress={() => setSlotsOpen(true)} accessibilityRole="button">
                  <MaterialIcons name="edit" size={theme.IconSizes.sm} color={theme.Colors.primary} />
                  <Text style={styles.textLinkLabel}>Edit meals</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardHint}>This menu repeats every week until you change it.</Text>

          <DayChips selected={selectedDay} today={today} errorDays={errorDays} dishCounts={dishCounts} onSelect={setSelectedDay} />

          <DayMenuEditor
            day={selectedDay}
            draftDay={draft[selectedDay]}
            slots={slots}
            error={errors[selectedDay]}
            readOnly={!canManage}
            onChange={(patch) => changeDay(selectedDay, patch)}
          />
        </GlassCard>
      )}

      {!isDesktop && saveButton ? (
        <View style={styles.mobileSave}>
          {isDirty ? <Text style={styles.unsavedText}>Unsaved changes</Text> : null}
          {errorDays.length > 0 ? <Text style={styles.fieldError}>Fix the highlighted days before saving.</Text> : null}
          {saveButton}
        </View>
      ) : null}

      <MealSlotsModal
        visible={isSlotsOpen}
        slots={slots}
        dishCountBySlot={dishCountBySlot}
        isSaving={isSavingSlots}
        onClose={() => setSlotsOpen(false)}
        onSave={saveSlots}
      />
      <CopyDayModal
        visible={isCopyOpen}
        from={selectedDay}
        onClose={() => setCopyOpen(false)}
        onCopy={(to) => {
          setEdits((prev) => copyDay(prev ?? draft, selectedDay, to));
          setCopyOpen(false);
        }}
      />
    </>
  );
}
