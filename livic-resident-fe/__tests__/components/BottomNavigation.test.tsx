import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import BottomNavigation from '../../src/components/common/navigation/BottomNavigation';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockPathname = '/tenant-home';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => mockPathname,
}));

let mockOpenRequests = 0;
jest.mock('@/src/features/auth/context/AuthProvider', () => ({ useAuth: () => ({ accessToken: 'test-token' }) }));
jest.mock('@/src/features/tenant/hooks/useOpenRequestCount', () => ({ useOpenRequestCount: () => mockOpenRequests }));
jest.mock('@/src/theme/haptics', () => ({ haptic: jest.fn() }));

describe('BottomNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/tenant-home';
    mockOpenRequests = 0;
  });

  it('tells screen readers how many requests are open', async () => {
    mockOpenRequests = 2;
    await render(<BottomNavigation onMorePress={jest.fn()} />);

    // A neutral dot, not a red count: the requests are waiting on the landlord, not the resident
    expect(screen.getByRole('tab', { name: 'Requests, 2 open' })).toBeTruthy();
    expect(screen.queryByText('2', { includeHiddenElements: true })).toBeNull();
  });

  it('marks the current tab as selected', async () => {
    await render(<BottomNavigation onMorePress={jest.fn()} />);

    expect(screen.getByRole('tab', { name: 'Home', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'More options', selected: false })).toBeTruthy();
  });

  it('selects More on a screen reached from the More sheet', async () => {
    mockPathname = '/tenant-mess';
    await render(<BottomNavigation onMorePress={jest.fn()} />);

    expect(screen.getByRole('tab', { name: 'More options', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Home', selected: false })).toBeTruthy();
  });

  it('switches tabs in place rather than stacking them', async () => {
    await render(<BottomNavigation onMorePress={jest.fn()} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Payments' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/tenant-payments');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the More sheet', async () => {
    const onMorePress = jest.fn();
    await render(<BottomNavigation onMorePress={onMorePress} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'More options' }));

    expect(onMorePress).toHaveBeenCalled();
  });
});
