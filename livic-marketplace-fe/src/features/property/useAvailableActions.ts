import { LeadType } from '@/types/lead';
import { PropertyDetail } from '@/types/property';

export function getAvailableActions(property: PropertyDetail | null): LeadType[] {
  if (!property) return ['TOUR_REQUEST', 'BOOKING'];
  // Today universal flow returns both TOUR_REQUEST and BOOKING.
  // Single extension point for future property-type specific action rules.
  return ['TOUR_REQUEST', 'BOOKING'];
}
