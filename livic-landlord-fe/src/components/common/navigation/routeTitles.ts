/**
 * The heading each screen shows at its top, for the phone top bar to repeat once that heading has
 * scrolled away. Screens not listed keep the property selector in the bar.
 */
const ROUTE_TITLES: Record<string, string> = {
  '/command-center': 'My Properties',
  '/leases': 'Leases & Bookings',
  '/inventory': 'Property Inventory',
  '/expenses': 'Billing Pipeline',
  '/expenses/rent-roll': 'Rent Roll & Invoices',
  '/expenses/billing-worksheet': 'Billing Worksheets',
  '/expenses/charge-config': 'Billing Configurations',
  '/expenses/ledger': 'General Ledger',
  '/create-expense': 'Configure Expense',
  '/billing': 'Subscription',
  '/escalations': 'Escalations & Issues',
  '/analytics': 'Ecosystem Analytics',
  '/announcements': 'Announcements',
  '/reports': 'Financial Reports',
  '/mess': 'Mess menu',
  '/settings': 'Team & System Hub',
};

export function getRouteTitle(pathname: string): string | undefined {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (/^\/properties\/[^/]+\/meter-readings/.test(pathname)) return 'Meter Readings';
  return undefined;
}
