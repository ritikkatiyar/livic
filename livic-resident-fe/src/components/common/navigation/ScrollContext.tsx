import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { useReducedMotion } from '@/src/theme/motion';

interface ScrollContextProps {
  navTranslateY: Animated.Value;
  handleScroll: (event: any) => void;
  resetNav: () => void;
  /** While an overlay such as Livi's chat is open the bar steps aside, and nothing brings it back. */
  setOverlayOpen: (open: boolean) => void;
  /** Re-tapping the open tab: the focused screen scrolls back to its top. */
  requestScrollToTop: () => void;
  subscribeScrollToTop: (listener: () => void) => () => void;
  /** Told when the page scrolls past (or back above) where a large page title leaves the screen. */
  subscribeTitleScrolledAway: (listener: (away: boolean) => void) => () => void;
  /** Told when content starts (or stops) passing under the top bar. */
  subscribeScrolledUnder: (listener: (under: boolean) => void) => () => void;
}

const ScrollContext = createContext<ScrollContextProps | undefined>(undefined);

/** `dataSet={{ navScroll: NAV_SCROLL_IGNORE }}` on an overlay keeps its scrolling from hiding the bottom bar (web). */
export const NAV_SCROLL_IGNORE = 'ignore';

// Within this distance of the end of the content the bar comes back, so the last screenful has its navigation
const END_ZONE = 24;
// About where a screen's large title has scrolled under the top bar
const TITLE_AWAY_OFFSET = 96;
// Any further than this and content is passing under the top bar
const SCROLLED_UNDER_OFFSET = 4;

export const useScrollNav = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    return {
      navTranslateY: new Animated.Value(0),
      handleScroll: () => {},
      resetNav: () => {},
      setOverlayOpen: () => {},
      requestScrollToTop: () => {},
      subscribeScrollToTop: () => () => {},
      subscribeTitleScrolledAway: () => () => {},
      subscribeScrolledUnder: () => () => {},
    };
  }
  return context;
};

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const navTranslateY = useRef(new Animated.Value(0)).current;
  const lastOffsetY = useRef(0);
  // A screen reader user can't see the bar slide back in, so it never hides for them
  const screenReaderOn = useRef(false);
  const overlayOpen = useRef(false);
  const titleAway = useRef(false);
  const titleListeners = useRef(new Set<(away: boolean) => void>()).current;
  const setTitleAway = (away: boolean) => {
    if (away === titleAway.current) return;
    titleAway.current = away;
    titleListeners.forEach((listener) => listener(away));
  };
  const subscribeTitleScrolledAway = (listener: (away: boolean) => void) => {
    titleListeners.add(listener);
    return () => {
      titleListeners.delete(listener);
    };
  };
  const scrolledUnder = useRef(false);
  const underListeners = useRef(new Set<(under: boolean) => void>()).current;
  const setScrolledUnder = (under: boolean) => {
    if (under === scrolledUnder.current) return;
    scrolledUnder.current = under;
    underListeners.forEach((listener) => listener(under));
  };
  const subscribeScrolledUnder = (listener: (under: boolean) => void) => {
    underListeners.add(listener);
    return () => {
      underListeners.delete(listener);
    };
  };
  const scrollToTopListeners = useRef(new Set<() => void>()).current;
  // With reduced motion the bar appears and disappears in place rather than sliding
  const reduceMotion = useReducedMotion();
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  const moveNav = (toValue: number, duration: number) =>
    Animated.timing(navTranslateY, {
      toValue,
      duration: reduceMotionRef.current ? 0 : duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  const pathname = usePathname();

  const resetNav = () => {
    lastOffsetY.current = 0;
    setTitleAway(false);
    setScrolledUnder(false);
    if (overlayOpen.current) return;
    moveNav(0, 280);
  };

  const setOverlayOpen = (open: boolean) => {
    overlayOpen.current = open;
    moveNav(open ? 120 : 0, open ? 160 : 220);
  };

  const requestScrollToTop = () => {
    scrollToTopListeners.forEach((listener) => listener());
    if (!overlayOpen.current) moveNav(0, 180);
  };

  const subscribeScrollToTop = (listener: () => void) => {
    scrollToTopListeners.add(listener);
    return () => {
      scrollToTopListeners.delete(listener);
    };
  };

  // Reset navigation bar & AI icon position smoothly whenever screen route changes
  useEffect(() => {
    resetNav();
  }, [pathname]);

  useEffect(() => {
    const apply = (enabled: boolean) => {
      screenReaderOn.current = enabled;
      if (enabled) resetNav();
    };
    AccessibilityInfo.isScreenReaderEnabled().then(apply).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', apply);
    return () => subscription.remove();
  }, []);

  const updateScrollState = (currentOffsetY: number, atEnd = false) => {
    setTitleAway(currentOffsetY > TITLE_AWAY_OFFSET);
    setScrolledUnder(currentOffsetY > SCROLLED_UNDER_OFFSET);
    if (overlayOpen.current) {
      lastOffsetY.current = currentOffsetY;
      return;
    }
    if (currentOffsetY <= 10 || atEnd || screenReaderOn.current) {
      moveNav(0, 180);
      lastOffsetY.current = currentOffsetY;
      return;
    }

    const diff = currentOffsetY - lastOffsetY.current;

    if (diff > 4) {
      moveNav(120, 200);
      lastOffsetY.current = currentOffsetY;
    } else if (diff < -4) {
      moveNav(0, 180);
      lastOffsetY.current = currentOffsetY;
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebScroll = (e: any) => {
        const target = e.target;
        // Scrolling inside an overlay such as Livi's chat is not the page moving
        if (target instanceof Element && target.closest(`[data-nav-scroll="${NAV_SCROLL_IGNORE}"]`)) return;
        const isElement = target && target !== document && target.scrollTop !== undefined;
        const currentOffsetY = isElement
          ? target.scrollTop
          : window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const atEnd = isElement
          ? target.scrollTop + target.clientHeight >= target.scrollHeight - END_ZONE
          : window.innerHeight + currentOffsetY >= document.documentElement.scrollHeight - END_ZONE;

        updateScrollState(currentOffsetY, atEnd);
      };

      window.addEventListener('scroll', handleWebScroll, { passive: true });
      document.addEventListener('scroll', handleWebScroll, { capture: true, passive: true });

      return () => {
        window.removeEventListener('scroll', handleWebScroll);
        document.removeEventListener('scroll', handleWebScroll, { capture: true });
      };
    }
  }, []);

  const handleScroll = (event: any) => {
    if (!event || !event.nativeEvent) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentOffsetY = contentOffset?.y ?? event.nativeEvent.scrollTop ?? 0;
    const atEnd =
      !!contentSize && !!layoutMeasurement && currentOffsetY + layoutMeasurement.height >= contentSize.height - END_ZONE;
    updateScrollState(currentOffsetY, atEnd);
  };

  return (
    <ScrollContext.Provider value={{ navTranslateY, handleScroll, resetNav, setOverlayOpen, requestScrollToTop, subscribeScrollToTop, subscribeTitleScrolledAway, subscribeScrolledUnder }}>
      {children}
    </ScrollContext.Provider>
  );
};

/** Whether the current page's large title has scrolled out of view, for the top bar's compact title. */
export function useTitleScrolledAway(): boolean {
  const { subscribeTitleScrolledAway } = useScrollNav();
  const [away, setAway] = React.useState(false);
  React.useEffect(() => subscribeTitleScrolledAway(setAway), [subscribeTitleScrolledAway]);
  return away;
}

/** Whether content is scrolled under the top bar, so the bar can show its edge. */
export function useScrolledUnder(): boolean {
  const { subscribeScrolledUnder } = useScrollNav();
  const [under, setUnder] = React.useState(false);
  React.useEffect(() => subscribeScrolledUnder(setUnder), [subscribeScrolledUnder]);
  return under;
}
