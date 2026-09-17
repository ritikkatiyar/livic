import React from 'react';
import { ScrollView, View } from 'react-native';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import Pagination from '@/src/components/common/navigation/Pagination';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { TourRequestFilter, TourRequestResponse } from '../api/tourRequest.api';
import { useTourRequests } from '../hooks/useTourRequests';
import { RejectTourModal } from './LeaseModals';
import { formatVisitSlot, TourRequestCard } from './TourRequestCard';
import { createTourRequestStyles } from './TourRequestsPanel.styles';
import { VisitingHoursBanner } from './visiting-hours/VisitingHoursBanner';

type TourRequestsPanelProps = {
  propertyId: string | null;
  isDesktop: boolean;
  /** Page-level search text; filters the loaded page by name, phone, email or unit. */
  searchQuery: string;
};

const EMPTY_STATES: Record<TourRequestFilter, { title: string; description: string }> = {
  PENDING: {
    title: 'No pending tour requests',
    description: 'New visit requests from the marketplace will appear here for you to approve or decline.',
  },
  UPCOMING: {
    title: 'No upcoming tours',
    description: 'Approved visits that are still ahead will be listed here.',
  },
  PAST: {
    title: 'No past tour requests',
    description: 'Declined, cancelled and completed visits will be kept here for reference.',
  },
};

export function matchesTourSearch(tour: TourRequestResponse, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [tour.prospectName, tour.prospectPhone, tour.prospectEmail, tour.unitNumber]
    .some((value) => (value || '').toLowerCase().includes(q));
}

export function TourRequestsPanel({ propertyId, isDesktop, searchQuery }: TourRequestsPanelProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createTourRequestStyles(theme), [theme]);

  const {
    filter, setFilter, page, setPage, totalPages,
    tourRequests, isLoading, summary,
    approve, approvingId,
    rejectingId, openReject, closeReject, reject, isRejecting,
  } = useTourRequests(propertyId);

  if (!propertyId) {
    return (
      <EmptyState
        iconName="apartment"
        title="Select a property"
        description="Choose a property to see its marketplace tour requests."
      />
    );
  }

  const visibleTours = tourRequests.filter((tour) => matchesTourSearch(tour, searchQuery));
  const rejectingTour = tourRequests.find((tour) => tour.id === rejectingId) ?? null;
  const decisionInFlight = Boolean(approvingId) || isRejecting;

  const filters: { id: TourRequestFilter; label: string; count?: number }[] = [
    { id: 'PENDING', label: 'Pending', count: summary.pending },
    { id: 'UPCOMING', label: 'Upcoming', count: summary.upcoming },
    { id: 'PAST', label: 'Past' },
  ];

  return (
    <View style={styles.panel}>
      <VisitingHoursBanner propertyId={propertyId} isDesktop={isDesktop} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((f) => (
          <FilterPill
            key={f.id}
            label={f.label}
            count={f.count}
            size="sm"
            active={filter === f.id}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.list} accessibilityLabel="Loading tour requests">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={168} borderRadius={theme.Rounded.xl} style={styles.skeletonCard} />
          ))}
        </View>
      ) : visibleTours.length === 0 ? (
        <EmptyState
          iconName="event-available"
          title={searchQuery.trim() ? 'No matching tour requests' : EMPTY_STATES[filter].title}
          description={searchQuery.trim() ? 'Try a different name, phone number or unit.' : EMPTY_STATES[filter].description}
        />
      ) : (
        <View style={styles.list}>
          {visibleTours.map((tour) => (
            <TourRequestCard
              key={tour.id}
              tour={tour}
              isDesktop={isDesktop}
              onApprove={approve}
              onReject={openReject}
              isApproving={approvingId === tour.id}
              actionsDisabled={decisionInFlight}
            />
          ))}
        </View>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <RejectTourModal
        visible={Boolean(rejectingTour)}
        onClose={closeReject}
        prospectName={rejectingTour?.prospectName ?? ''}
        visitLabel={rejectingTour ? formatVisitSlot(rejectingTour.preferredSlot) : ''}
        onSubmit={reject}
        isSubmitting={isRejecting}
      />
    </View>
  );
}
