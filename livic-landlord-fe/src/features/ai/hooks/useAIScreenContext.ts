import { useMemo } from 'react';
import { usePathname } from 'expo-router';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useProperties } from '@/src/hooks/useProperties';
import type { AIScreenContext } from '../api/ai.api';

interface ScreenInfo {
  screenName: string;
  /** Prompts suggested in the assistant while this screen is open. Keep them short. */
  suggestions: string[];
}

const DEFAULT_SCREEN: ScreenInfo = {
  screenName: 'Livic',
  suggestions: [
    'Create a new property',
    'Help me plan units for a 5 floor PG',
    'What can you help me with?',
  ],
};

// First matching prefix wins, so more specific routes come first.
const SCREENS: { match: (path: string) => boolean; info: ScreenInfo }[] = [
  {
    match: (p) => /^\/properties\/[^/]+\/(blocks|floors)/.test(p),
    info: { screenName: 'Floors & units', suggestions: ['How do I add rooms to a floor?', 'How do I mark a unit vacant?'] },
  },
  {
    match: (p) => /^\/properties\/[^/]+\/meter-readings/.test(p),
    info: { screenName: 'Meter readings', suggestions: ['How do I record a meter reading?', 'How are utility bills calculated?'] },
  },
  {
    match: (p) => /^\/properties\/[^/]+\/visiting-hours/.test(p),
    info: { screenName: 'Visiting hours', suggestions: ['How do I block visits on a holiday?', 'How do tour requests work?'] },
  },
  {
    match: (p) => p === '/properties/create',
    info: { screenName: 'Create property', suggestions: ['Create a 5 floor PG with 4 rooms per floor', 'What details do I need?'] },
  },
  {
    match: (p) => /^\/properties\/[^/]+/.test(p),
    info: { screenName: 'Property settings', suggestions: ['What can I change for this property?', 'How do I add a block?'] },
  },
  {
    match: (p) => p === '/' || p === '/command-center',
    info: { screenName: 'Home (my properties)', suggestions: ['Create a new property', 'How do I set up floors and units?'] },
  },
  {
    match: (p) => p.startsWith('/leases'),
    info: { screenName: 'Leases & bookings', suggestions: ['How do I serve a notice?', 'How do I book a room?', 'Draft a move-out notice message'] },
  },
  {
    match: (p) => p.startsWith('/expenses/rent-roll') || p === '/billing',
    info: { screenName: 'Rent roll & invoices', suggestions: ['How do I generate this month’s invoices?', 'What does the billing worksheet check?'] },
  },
  {
    match: (p) => p.startsWith('/expenses'),
    info: { screenName: 'Finance', suggestions: ['How do I add an expense?', 'How do I set up charges?'] },
  },
  {
    match: (p) => p.startsWith('/escalations'),
    info: { screenName: 'Maintenance issues', suggestions: ['How do I escalate an issue?', 'Draft a reply to a tenant complaint'] },
  },
  {
    match: (p) => p.startsWith('/analytics') || p.startsWith('/reports'),
    info: { screenName: 'Analytics & reports', suggestions: ['What does occupancy rate mean here?', 'Which report shows collections?'] },
  },
  {
    match: (p) => p.startsWith('/inventory'),
    info: { screenName: 'Inventory', suggestions: ['How do I record move-in inventory?', 'How are move-out damages charged?'] },
  },
];

function resolveScreen(pathname: string): ScreenInfo {
  return SCREENS.find((s) => s.match(pathname))?.info ?? DEFAULT_SCREEN;
}

/**
 * Describes what the landlord is currently looking at, so the AI assistant can
 * interpret "this property", "these leases", etc. and suggest relevant prompts.
 */
export function useAIScreenContext(): { context: AIScreenContext; suggestions: string[]; label: string } {
  const pathname = usePathname();
  const { selectedPropertyId, selectedBlockId } = useGlobalPropertySelection();
  const { properties } = useProperties();

  return useMemo(() => {
    const screen = resolveScreen(pathname);

    // Property detail routes carry their own id; everywhere else use the global selector.
    const routePropertyId = pathname.match(/^\/properties\/([^/]+)/)?.[1];
    const propertyId = routePropertyId && routePropertyId !== 'create' ? routePropertyId : selectedPropertyId;
    const propertyName = propertyId ? properties.find((p) => p.id === propertyId)?.name : undefined;

    const context: AIScreenContext = {
      route: pathname,
      screenName: screen.screenName,
      propertyId: propertyId ?? undefined,
      propertyName,
      blockId: selectedBlockId ?? undefined,
    };

    const label = propertyName ? `${screen.screenName} · ${propertyName}` : `${screen.screenName} · All properties`;
    return { context, suggestions: screen.suggestions, label };
  }, [pathname, selectedPropertyId, selectedBlockId, properties]);
}
