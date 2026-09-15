import type { MyContextResponse } from '@/src/features/auth/api/me.api';

/** Owner-only areas (SaaS billing, AI desk) that no custom-access grant unlocks. */
export const FULL_ACCESS_ONLY = 'FULL_ACCESS' as const;

type Requirement = readonly string[] | typeof FULL_ACCESS_ONLY;

const FINANCE_VIEW_CODES = [
  'METER_READING_VIEW',
  'CHARGE_CONFIG_VIEW',
  'BILLING_WORKSHEET_VIEW',
  'RENT_ROLL_VIEW',
  'LEDGER_VIEW',
] as const;

/**
 * Staff permission required to open a screen. First match wins, so specific paths come before their parents.
 * Routes not listed (Portfolio, Settings, property creation) are open to every signed-in user.
 * The backend enforces the same codes; this only decides what is shown.
 */
const ROUTE_REQUIREMENTS: { pattern: RegExp; anyOf: Requirement }[] = [
  { pattern: /^\/expenses\/charge-config/, anyOf: ['CHARGE_CONFIG_VIEW'] },
  { pattern: /^\/expenses\/billing-worksheet/, anyOf: ['BILLING_WORKSHEET_VIEW'] },
  { pattern: /^\/expenses\/rent-roll/, anyOf: ['RENT_ROLL_VIEW'] },
  { pattern: /^\/expenses\/ledger/, anyOf: ['LEDGER_VIEW'] },
  { pattern: /^\/expenses/, anyOf: FINANCE_VIEW_CODES },
  { pattern: /^\/create-expense/, anyOf: ['CHARGE_CONFIG_MANAGE'] },
  { pattern: /^\/properties\/[^/]+\/meter-readings/, anyOf: ['METER_READING_VIEW'] },
  { pattern: /^\/properties\/[^/]+\/memberships/, anyOf: ['STAFF_VIEW'] },
  { pattern: /^\/analytics/, anyOf: ['ANALYTICS_VIEW'] },
  { pattern: /^\/reports/, anyOf: ['REPORTS_VIEW'] },
  { pattern: /^\/leases/, anyOf: ['LEASE_VIEW'] },
  { pattern: /^\/inventory/, anyOf: ['INVENTORY_VIEW'] },
  { pattern: /^\/escalations/, anyOf: ['ISSUE_VIEW'] },
  { pattern: /^\/announcements/, anyOf: ['ANNOUNCEMENT_VIEW', 'ANNOUNCEMENT_CREATE'] },
  { pattern: /^\/billing/, anyOf: FULL_ACCESS_ONLY },
  { pattern: /^\/ai/, anyOf: FULL_ACCESS_ONLY },
];

export function routeRequirement(route: string): Requirement | null {
  const path = route.split('?')[0];
  return ROUTE_REQUIREMENTS.find((r) => r.pattern.test(path))?.anyOf ?? null;
}

/**
 * True when the user holds any of the codes on the given property, or on any managed property when no
 * propertyId is passed (navigation is portfolio-wide). A landlord who has not created a property yet
 * has no memberships and keeps every screen, since they will own whatever they create.
 */
export function hasPermission(
  context: MyContextResponse | null,
  anyOf: Requirement,
  propertyId?: string | null,
): boolean {
  if (!context) return false;
  const memberships = context.managedProperties ?? [];
  if (memberships.length === 0) return true;

  const scoped = propertyId ? memberships.filter((m) => m.propertyId === propertyId) : memberships;
  if (anyOf === FULL_ACCESS_ONLY) {
    return scoped.some((m) => m.accessType === 'FULL_ACCESS');
  }
  return scoped.some((m) => m.accessType === 'FULL_ACCESS' || anyOf.some((code) => m.permissionCodes?.includes(code)));
}

export function canAccessRoute(context: MyContextResponse | null, route: string): boolean {
  const requirement = routeRequirement(route);
  return requirement === null || hasPermission(context, requirement);
}
