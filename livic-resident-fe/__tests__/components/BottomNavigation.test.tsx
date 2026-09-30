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

describe('BottomNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/tenant-home';
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
