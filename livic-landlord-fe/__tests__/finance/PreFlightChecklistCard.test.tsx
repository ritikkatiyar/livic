import React from 'react';
import { render } from '@testing-library/react-native';
import { PreFlightChecklistCard } from '../../src/features/finance/components/billing/PreFlightChecklistCard';
import type { PreFlightChecklistResponse } from '../../src/features/finance/api/rentCycle.api';

jest.mock('expo-blur', () => ({ BlurView: jest.requireActual('react-native').View }));

const renderCard = (checklist: PreFlightChecklistResponse) =>
  render(
    <PreFlightChecklistCard
      checklist={checklist}
      billingMonth="2026-09"
      isGenerating={false}
      isDesktop={false}
      onGenerate={jest.fn()}
    />
  );

describe('PreFlightChecklistCard', () => {
  it('measures active leases against beds, so shared rooms never read as over 100%', async () => {
    // 100 double rooms, each with two tenants.
    const { getByText, queryByText } = await renderCard({
      totalUnits: 100,
      totalBeds: 200,
      activeLeases: 200,
      meterReadingsExpected: 100,
      meterReadingsEntered: 100,
      isReady: true,
    });

    expect(getByText('200 / 200')).toBeTruthy();
    expect(getByText('beds across 100 units')).toBeTruthy();
    expect(queryByText('200 / 100')).toBeNull();
  });

  it('shows the lease count alone when the server does not report beds', async () => {
    const { getByText, queryByText } = await renderCard({
      totalUnits: 100,
      activeLeases: 200,
      meterReadingsExpected: 0,
      meterReadingsEntered: 0,
      isReady: true,
    });

    expect(getByText('200')).toBeTruthy();
    expect(queryByText('200 / 100')).toBeNull();
  });
});
