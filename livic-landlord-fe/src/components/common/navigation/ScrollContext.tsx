import React, { createContext, useContext, useRef, useEffect, useMemo, ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { useReducedMotion } from '@/src/theme/motion';

type NavHiddenListener = (hidden: boolean) => void;

interface ScrollContextProps {
  /** 0 = nav shown, NAV_HIDDEN_OFFSET = nav hidden. Native-driven: use only for transform/opacity. */
  navTranslateY: Animated.Value;
  handleScroll: (event: any) => void;
  resetNav: () => void;
  /** Notified only when the nav actually hides or shows (not on every scroll event). */
  subscribeNavHidden: (listener: NavHiddenListener) => () => void;
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

export const NAV_HIDDEN_OFFSET = 120;

/** `dataSet={{ navScroll: NAV_SCROLL_IGNORE }}` on an overlay keeps its scrolling from hiding the bottom bar (web). */
export const NAV_SCROLL_IGNORE = 'ignore';
// Ignore tiny jitters so the nav doesn't flicker on small finger movements
const DIRECTION_THRESHOLD = 4;
const TOP_ZONE = 10;
// Within this distance of the end of the content the bar comes back, so the last screenful has its navigation
const END_ZONE = 24;
// About where a screen's large title has scrolled under the top bar
const TITLE_AWAY_OFFSET = 96;
// Any further than this and content is passing under the top bar
const SCROLLED_UNDER_OFFSET = 4;
// Keep the bar while the person is still near the top of a list. Short inner lists and a
// scroll position the browser restores on reload would otherwise hide it before they
// have scrolled at all.
const MIN_HIDE_OFFSET = 80;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
// How long after a wheel, swipe or key press a web scroll still counts as user-driven
const USER_SCROLL_WINDOW_MS = 400;
const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);

/** Last seen offset of one scrollable area, valid for one `generation` (route visit). */
interface ScrollOrigin {
  offset: number;
  generation: number;
}

const ScrollContext = createContext<ScrollContextProps | undefined>(undefined);

const fallbackContext: ScrollContextProps = {
  navTranslateY: new Animated.Value(0),
  handleScroll: () => {},
  resetNav: () => {},
  subscribeNavHidden: () => () => {},
  setOverlayOpen: () => {},
  requestScrollToTop: () => {},
  subscribeScrollToTop: () => () => {},
  subscribeTitleScrolledAway: () => () => {},
  subscribeScrolledUnder: () => () => {},
};

export const useScrollNav = () => useContext(ScrollContext) ?? fallbackContext;

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const navTranslateY = useRef(new Animated.Value(0)).current;
  const screenOrigin = useRef<ScrollOrigin>({ offset: 0, generation: 0 });
  const generation = useRef(0);
  const isHidden = useRef(false);
  // A screen reader user can't see the bar slide back in, so it never hides for them
  const screenReaderOn = useRef(false);
  const listeners = useRef(new Set<NavHiddenListener>()).current;
  const scrollToTopListeners = useRef(new Set<() => void>()).current;
  const overlayOpen = useRef(false);
  const titleAway = useRef(false);
  const titleListeners = useRef(new Set<(away: boolean) => void>()).current;
  const scrolledUnder = useRef(false);
  const underListeners = useRef(new Set<(under: boolean) => void>()).current;
  // With reduced motion the bar appears and disappears in place rather than sliding
  const reduceMotion = useReducedMotion();
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  const pathname = usePathname();

  const [value, updateScrollState] = useMemo(() => {
    // Only start an animation when the hidden/shown state flips; scroll events alone do nothing.
    const setHidden = (hidden: boolean, duration: number) => {
      if (hidden === isHidden.current) return;
      isHidden.current = hidden;
      Animated.timing(navTranslateY, {
        toValue: hidden ? NAV_HIDDEN_OFFSET : 0,
        duration: reduceMotionRef.current ? 0 : duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
      listeners.forEach((listener) => listener(hidden));
    };

    // `origin` is the scrollable area the event came from: each one keeps its own last
    // offset, so a nested list scrolling does not read as the page jumping down.
    const setTitleAway = (away: boolean) => {
      if (away === titleAway.current) return;
      titleAway.current = away;
      titleListeners.forEach((listener) => listener(away));
    };
    const setScrolledUnder = (under: boolean) => {
      if (under === scrolledUnder.current) return;
      scrolledUnder.current = under;
      underListeners.forEach((listener) => listener(under));
    };

    const updateScrollState = (currentOffsetY: number, origin: ScrollOrigin, atEnd = false) => {
      setTitleAway(currentOffsetY > TITLE_AWAY_OFFSET);
      setScrolledUnder(currentOffsetY > SCROLLED_UNDER_OFFSET);
      const isFirstEvent = origin.generation !== generation.current;
      origin.generation = generation.current;
      if (overlayOpen.current) {
        origin.offset = currentOffsetY;
        return;
      }
      if (screenReaderOn.current) {
        setHidden(false, 0);
        origin.offset = currentOffsetY;
        return;
      }
      if (currentOffsetY <= TOP_ZONE || atEnd) {
        setHidden(false, 180);
        origin.offset = currentOffsetY;
        return;
      }
      // The first event from an area only establishes where it starts — a list that mounts
      // already scrolled (or a restored scroll position) is not a downward swipe.
      if (isFirstEvent) {
        origin.offset = currentOffsetY;
        return;
      }
      const diff = currentOffsetY - origin.offset;
      if (Math.abs(diff) <= DIRECTION_THRESHOLD) return;
      origin.offset = currentOffsetY;
      if (diff > 0 && currentOffsetY < MIN_HIDE_OFFSET) return;
      setHidden(diff > 0, diff > 0 ? 200 : 180);
    };

    const contextValue: ScrollContextProps = {
      navTranslateY,
      handleScroll: (event: any) => {
        if (!event?.nativeEvent) return;
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const offsetY = contentOffset?.y ?? event.nativeEvent.scrollTop ?? 0;
        const atEnd =
          !!contentSize && !!layoutMeasurement && offsetY + layoutMeasurement.height >= contentSize.height - END_ZONE;
        updateScrollState(offsetY, screenOrigin.current, atEnd);
      },
      resetNav: () => {
        // Bump the generation so every scrollable area re-establishes its starting offset
        generation.current += 1;
        screenOrigin.current = { offset: 0, generation: generation.current };
        setTitleAway(false);
        setScrolledUnder(false);
        if (overlayOpen.current) return;
        setHidden(false, 280);
      },
      subscribeNavHidden: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      setOverlayOpen: (open) => {
        overlayOpen.current = open;
        setHidden(open, open ? 160 : 220);
      },
      requestScrollToTop: () => {
        scrollToTopListeners.forEach((listener) => listener());
        setHidden(false, 180);
      },
      subscribeTitleScrolledAway: (listener) => {
        titleListeners.add(listener);
        return () => {
          titleListeners.delete(listener);
        };
      },
      subscribeScrolledUnder: (listener) => {
        underListeners.add(listener);
        return () => {
          underListeners.delete(listener);
        };
      },
      subscribeScrollToTop: (listener) => {
        scrollToTopListeners.add(listener);
        return () => {
          scrollToTopListeners.delete(listener);
        };
      },
    };
    return [contextValue, updateScrollState] as const;
  }, [navTranslateY, listeners, scrollToTopListeners, titleListeners, underListeners]);

  useEffect(() => {
    const apply = (enabled: boolean) => {
      screenReaderOn.current = enabled;
      if (enabled) value.resetNav();
    };
    AccessibilityInfo.isScreenReaderEnabled().then(apply).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', apply);
    return () => subscription.remove();
  }, [value]);

  // Show the nav again whenever the route changes
  useEffect(() => {
    value.resetNav();
  }, [pathname, value]);

  // Global capture listener on web for any scrollable container/element
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const origins = new WeakMap<object, ScrollOrigin>();
    const originFor = (target: object, offset: number): ScrollOrigin => {
      let origin = origins.get(target);
      if (!origin) {
        origin = { offset, generation: -1 };
        origins.set(target, origin);
      }
      return origin;
    };

    // Only a scroll the person drives should hide the bar. The browser also fires 'scroll'
    // for a restored position, for a list that mounts already scrolled and for a screen
    // settling behind the one in front — none of which are a downward swipe.
    let userScrollingUntil = 0;
    const markUserIntent = () => {
      userScrollingUntil = Date.now() + USER_SCROLL_WINDOW_MS;
    };
    const markKeyIntent = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) markUserIntent();
    };
    const markDragIntent = (e: PointerEvent) => {
      if (e.buttons !== 0) markUserIntent();
    };

    const handleWebScroll = (e: any) => {
      const target = e.target;
      // Scrolling inside an overlay such as Livi's chat is not the page moving
      if (target instanceof Element && target.closest(`[data-nav-scroll="${NAV_SCROLL_IGNORE}"]`)) return;
      const isElement = target && target !== document && target.scrollTop !== undefined;
      const currentOffsetY = isElement
        ? target.scrollTop
        : window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const origin = originFor(isElement ? target : document, currentOffsetY);
      if (Date.now() > userScrollingUntil) {
        // Not the person scrolling: remember where this area sits, but leave the bar alone
        origin.offset = currentOffsetY;
        origin.generation = generation.current;
        return;
      }
      // Momentum keeps the session alive as long as events keep arriving
      markUserIntent();
      const atEnd = isElement
        ? target.scrollTop + target.clientHeight >= target.scrollHeight - END_ZONE
        : window.innerHeight + currentOffsetY >= document.documentElement.scrollHeight - END_ZONE;
      updateScrollState(currentOffsetY, origin, atEnd);
    };

    window.addEventListener('wheel', markUserIntent, { passive: true });
    window.addEventListener('touchmove', markUserIntent, { passive: true });
    window.addEventListener('keydown', markKeyIntent, { passive: true });
    window.addEventListener('pointermove', markDragIntent, { passive: true });
    window.addEventListener('scroll', handleWebScroll, { passive: true });
    document.addEventListener('scroll', handleWebScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('wheel', markUserIntent);
      window.removeEventListener('touchmove', markUserIntent);
      window.removeEventListener('keydown', markKeyIntent);
      window.removeEventListener('pointermove', markDragIntent);
      window.removeEventListener('scroll', handleWebScroll);
      document.removeEventListener('scroll', handleWebScroll, { capture: true });
    };
  }, [updateScrollState]);

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
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
