import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * How much of the screen the app's chrome covers, in px. Every piece of it floats over
 * content — the header is positioned absolute (fixed on web), and the bottom bar and
 * assistant bubble hover above the bottom edge — so screens must pad by these amounts.
 *
 * Screens read this through `useAppChromeInsets()` instead of hardcoding sizes, and each
 * piece of chrome reports its own measured height, so resizing the header or the bottom
 * bar never requires touching individual screens. Screens rendered outside the app shell
 * (login, onboarding, the AI desk) get zeros, because nothing registers there.
 */
export interface AppChromeInsets {
  top: number;
  bottom: number;
}

type ChromeSlot = 'header' | 'tabBar' | 'assistant';

interface AppChromeValue {
  insets: AppChromeInsets;
  /** Called by chrome components with their measured height (0 when hidden). */
  setSlotHeight: (slot: ChromeSlot, height: number) => void;
}

const EMPTY_INSETS: AppChromeInsets = { top: 0, bottom: 0 };

const AppChromeContext = createContext<AppChromeValue>({
  insets: EMPTY_INSETS,
  setSlotHeight: () => {},
});

export function AppChromeProvider({ children }: { children: React.ReactNode }) {
  const [heights, setHeights] = useState<Record<ChromeSlot, number>>({ header: 0, tabBar: 0, assistant: 0 });

  const setSlotHeight = useCallback((slot: ChromeSlot, height: number) => {
    const rounded = Math.round(height);
    setHeights((prev) => (prev[slot] === rounded ? prev : { ...prev, [slot]: rounded }));
  }, []);

  const value = useMemo<AppChromeValue>(
    () => ({
      // The assistant bubble floats above the bottom bar, so together they cover the
      // bottom edge; content must clear both.
      insets: { top: heights.header, bottom: heights.tabBar + heights.assistant },
      setSlotHeight,
    }),
    [heights, setSlotHeight]
  );

  return <AppChromeContext.Provider value={value}>{children}</AppChromeContext.Provider>;
}

export function useAppChrome(): AppChromeValue {
  return useContext(AppChromeContext);
}

/** Space the chrome covers on the current screen. */
export function useAppChromeInsets(): AppChromeInsets {
  return useContext(AppChromeContext).insets;
}
