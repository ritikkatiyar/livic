import type { BadgeVariant } from '@/components/ui/Badge';
import type { LeadStatus } from '@/types/lead';

type TourStatusPresentation = {
  label: string;
  variant: BadgeVariant;
  /** One-line explanation for the prospect. */
  description: string;
};

const PRESENTATION: Partial<Record<LeadStatus, TourStatusPresentation>> = {
  NEW: {
    label: 'Pending approval',
    variant: 'warning',
    description: 'The property manager will review your request and confirm the visit.',
  },
  APPROVED: {
    label: 'Approved',
    variant: 'success',
    description: 'Your visit is confirmed. Please arrive at the scheduled time.',
  },
  REJECTED: {
    label: 'Declined',
    variant: 'danger',
    description: 'The property manager could not accommodate this visit.',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    description: 'You cancelled this visit.',
  },
  COMPLETED: {
    label: 'Visit completed',
    variant: 'indigo',
    description: 'This visit has taken place.',
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'default',
    description: 'The visit time passed before the request was confirmed.',
  },
};

export function getTourStatusPresentation(status: LeadStatus): TourStatusPresentation {
  return PRESENTATION[status] ?? { label: status.replace(/_/g, ' '), variant: 'default', description: '' };
}

/** e.g. "Thu, 17 Sept, 5:00 pm" in the visitor's locale timezone. */
export function formatVisitSlot(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export const MY_REQUESTS_PATH = '/market-place/my-requests';
