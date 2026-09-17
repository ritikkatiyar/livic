import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreatePropertyScreen from '../../src/features/properties/screens/CreatePropertyScreen';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

// The admin setup tutorial bar needs its provider and isn't what this test covers
jest.mock('../../src/features/onboarding/components/ContextualStepGuideBar', () => ({
  ContextualStepGuideBar: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../../src/features/properties/api/property.api', () => ({
  createProperty: jest.fn(() => Promise.resolve({ id: 'prop-123' })),
}));

jest.mock('../../src/features/properties/api/unit.api', () => ({
  generateBatchUnits: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'owner-123' },
    signOut: jest.fn(),
  }),
}));

jest.setTimeout(30000);

describe('CreatePropertyScreen Interaction', () => {
  it('calls onSaveAndConfigure callback upon valid property input submission', async () => {
    const handleSaveAndConfigure = jest.fn();
    const { getByPlaceholderText, getByTestId } = await render(
      <CreatePropertyScreen
        userToken="token"
        ownerId="owner-123"
        onSaveAndConfigure={handleSaveAndConfigure}
      />
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('e.g. Apex Tower'), 'Test Property');
      fireEvent.changeText(getByPlaceholderText('e.g. 100 Horizon Boulevard'), 'Test Address');
      fireEvent.changeText(getByPlaceholderText('e.g. Bengaluru'), 'Test City');
      fireEvent.changeText(getByPlaceholderText('0'), '3');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      expect(handleSaveAndConfigure).toHaveBeenCalledWith('prop-123', 3);
    });
  });
});
