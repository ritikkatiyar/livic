import React, { useState } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Collapsible } from '../../src/components/common/motion/Collapsible';
import { FillReveal } from '../../src/components/common/motion/FillReveal';
import { PressableScale } from '../../src/components/common/motion/PressableScale';
import { SuccessCheck } from '../../src/components/common/motion/SuccessCheck';

describe('PressableScale', () => {
  it('presses like a button', async () => {
    const onPress = jest.fn();
    await render(<PressableScale onPress={onPress}><Text>Save</Text></PressableScale>);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while disabled', async () => {
    const onPress = jest.fn();
    await render(<PressableScale onPress={onPress} disabled><Text>Save</Text></PressableScale>);

    await fireEvent.press(screen.getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Collapsible', () => {
  function Toggle() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Text onPress={() => setOpen((v) => !v)}>Floor 1</Text>
        <Collapsible expanded={open}>
          <Text>Unit 101</Text>
        </Collapsible>
      </>
    );
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('mounts its content only while open', async () => {
    await render(<Toggle />);
    expect(screen.queryByText('Unit 101')).toBeNull();

    await fireEvent.press(screen.getByText('Floor 1'));
    expect(screen.getByText('Unit 101')).toBeTruthy();

    await fireEvent.press(screen.getByText('Floor 1'));
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.queryByText('Unit 101')).toBeNull();
  });
});

describe('SuccessCheck and FillReveal', () => {
  it('draw their content', async () => {
    await render(
      <>
        <SuccessCheck color="green" playKey="1" />
        <FillReveal>
          <Text>86% occupied</Text>
        </FillReveal>
      </>
    );

    expect(screen.getByLabelText('Done')).toBeTruthy();
    expect(screen.getByText('86% occupied')).toBeTruthy();
  });
});
