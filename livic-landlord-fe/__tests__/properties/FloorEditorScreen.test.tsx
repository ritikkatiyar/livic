import React from 'react';
import { render } from '@testing-library/react-native';
import FloorEditorScreen from '../../src/features/properties/screens/FloorEditorScreen';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const mockGesture = new Proxy({}, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      return jest.fn().mockReturnValue(mockGesture);
    }
  });
  return {
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: {
      Pan: () => mockGesture,
      Pinch: () => mockGesture,
      Tap: () => mockGesture,
      Race: jest.fn().mockReturnValue(mockGesture),
      Exclusive: jest.fn().mockReturnValue(mockGesture),
      Simultaneous: jest.fn().mockReturnValue(mockGesture),
    },
  };
});

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../../src/features/properties/api/unit.api', () => ({
  getFloorLayout: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'owner-123' },
    signOut: jest.fn(),
  }),
}));

jest.setTimeout(30000);

describe('FloorEditorScreen Component', () => {
  it('renders correct floor edit heading', async () => {
    const { getByText } = await render(
      <FloorEditorScreen
        propertyId="prop-123"
        floorNumber={2}
        userToken="token"
        onBack={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(getByText('Floor 2 layout')).toBeTruthy();
  });
});
