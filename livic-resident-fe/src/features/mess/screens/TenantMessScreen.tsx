import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import { FilterPill } from '@/src/components/common/inputs/FilterPill';
import { PageShell } from '@/src/components/common/layout/PageShell';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DayOfWeek } from '../api/messMenu.api';
import { DayMenuView } from '../components/DayMenuView';
import { createMessMenuStyles } from '../components/MessMenu.styles';
import { useMyMessMenu } from '../hooks/useMyMessMenu';
import { DAY_LABELS, DAYS_OF_WEEK, todayDayOfWeek } from '../utils/messMenu';

/** The week's mess menu where the resident lives, opening on today. */
export default function TenantMessScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const { accessToken } = useAuth();
  const { data: menu, isLoading, error, refetch } = useMyMessMenu(accessToken);

  const today = todayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);

  const renderBody = () => {
    if (error && !menu) {
      return (
        <EmptyState
          iconName="error-outline"
          title="Couldn't load the menu"
          description={error.message || 'Please try again.'}
          actionText="Try again"
          onAction={() => refetch()}
        />
      );
    }
    if (isLoading || !menu) {
      return (
        <View style={styles.skeletonStack} accessibilityLabel="Loading the mess menu">
          <Skeleton height={40} borderRadius={theme.Rounded.full} />
          <Skeleton height={320} borderRadius={theme.Rounded.xl} />
        </View>
      );
    }
    if (!menu.enabled || menu.slots.length === 0) {
      return (
        <EmptyState
          iconName="restaurant-menu"
          title="No mess menu yet"
          description="Your property hasn't shared a mess menu in Livic. Once it does, the week's meals will show up here."
        />
      );
    }
    return (
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChips}>
          {DAYS_OF_WEEK.map((day) => (
            <FilterPill
              key={day}
              label={day === today ? `${DAY_LABELS[day].short} · Today` : DAY_LABELS[day].short}
              active={day === selectedDay}
              onPress={() => setSelectedDay(day)}
              size="sm"
            />
          ))}
        </ScrollView>
        <Text style={styles.dayTitle}>{DAY_LABELS[selectedDay].long}</Text>
        <DayMenuView menu={menu} day={selectedDay} />
      </View>
    );
  };

  return (
    <PageShell
      scrollable
      header={isDesktop ? <DesktopNavBar title="Mess Menu" activeTab="Mess Menu" /> : null}
      edges={isDesktop ? ['top'] : []}
      onScroll={handleScroll}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>MESS</Text>
        <Text style={styles.title}>This week&apos;s menu</Text>
        <Text style={styles.subtitle}>The same menu repeats every week unless your mess changes it.</Text>
      </View>
      {renderBody()}
    </PageShell>
  );
}
