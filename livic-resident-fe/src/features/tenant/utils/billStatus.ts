import type { AppTheme } from '@/src/theme/ThemeContext';

/** Bill statuses as a resident would say them; only overdue gets an alarm colour. */
export function getBillStatus(status: string, theme: AppTheme): { label: string; color: string } {
  switch (status) {
    case 'PUBLISHED':
      return { label: 'Due', color: theme.Colors.primary };
    case 'PAID':
      return { label: 'Paid', color: theme.Colors.success };
    case 'PARTIALLY_PAID':
      return { label: 'Part paid', color: theme.Colors.tertiary };
    case 'OVERDUE':
      return { label: 'Overdue', color: theme.Colors.error };
    case 'ACTIVE':
      return { label: 'Active', color: theme.Colors.primary };
    default:
      return { label: status, color: theme.Colors.onSurfaceVariant };
  }
}
