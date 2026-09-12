import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SuperAdminLoginScreen from '../../src/features/auth/screens/SuperAdminLoginScreen';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('../../src/features/auth/api/auth.api', () => ({
  login: jest.fn(() => Promise.resolve({ accessToken: 'mock-token' })),
}));

jest.setTimeout(30000);

describe('SuperAdminLoginScreen Interaction', () => {
  it('calls onLogin handler on successful form submission', async () => {
    const handleLogin = jest.fn();
    const { getByPlaceholderText, getByTestId } = await render(
      <SuperAdminLoginScreen onLogin={handleLogin} />
    );

    const emailInput = getByPlaceholderText('landlord@livic.app');
    const passwordInput = getByPlaceholderText('••••••••');
    const submitBtn = getByTestId('login-button');

    await act(async () => {
      fireEvent.changeText(emailInput, 'landlord@livic.app');
      fireEvent.changeText(passwordInput, 'admin123');
    });

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledWith({ accessToken: 'mock-token' });
    });
  });
});
