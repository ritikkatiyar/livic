import React, { createContext, useContext, useRef, useEffect, useMemo, ReactNode } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { usePathname } from 'expo-router';

type NavHiddenListener = (hidden: boolean) => void;

interface ScrollContextProps {
  /** 0 = nav shown, NAV_HIDDEN_OFFSET = nav hidden. Native-driven: use only for transform/opacity. */
  navTranslateY: Animated.Value;
  handleScroll: (event: any) => void;
  resetNav: () => void;
  /** Notified only when the nav actually hides or shows (not on every scroll event). */
  subscribeNavHidden: (listener: NavHiddenListener) => () => void;
}

export const NAV_HIDDEN_OFFSET = 120;
// Ignore tiny jitters so the nav doesn't flicker on small finger movements
const DIRECTION_THRESHOLD = 4;
const TOP_ZONE = 10;
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
};

export const useScrollNav = () => useContext(ScrollContext) ?? fallbackContext;

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const navTranslateY = useRef(new Animated.Value(0)).current;
  const screenOrigin = useRef<ScrollOrigin>({ offset: 0, generation: 0 });
  const generation = useRef(0);
  const isHidden = useRef(false);
  const listeners = useRef(new Set<NavHiddenListener>()).current;
  const pathname = usePathname();

  const [value, updateScrollState] = useMemo(() => {
    // Only start an animation when the hidden/shown state flips; scroll events alone do nothing.
    const setHidden = (hidden: boolean, duration: number) => {
      if (hidden === isHidden.current) return;
      isHidden.current = hidden;
      Animated.timing(navTranslateY, {
        toValue: hidden ? NAV_HIDDEN_OFFSET : 0,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
      listeners.forEach((listener) => listener(hidden));
    };

    // `origin` is the scrollable area the event came from: each one keeps its own last
    // offset, so a nested list scrolling does not read as the page jumping down.
    const updateScrollState = (currentOffsetY: number, origin: ScrollOrigin) => {
      const isFirstEvent = origin.generation !== generation.current;
      origin.generation = generation.current;
      if (currentOffsetY <= TOP_ZONE) {
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
        updateScrollState(
          event.nativeEvent.contentOffset?.y ?? event.nativeEvent.scrollTop ?? 0,
          screenOrigin.current
        );
      },
      resetNav: () => {
        // Bump the generation so every scrollable area re-establishes its starting offset
        generation.current += 1;
        screenOrigin.current = { offset: 0, generation: generation.current };
        setHidden(false, 280);
      },
      subscribeNavHidden: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    };
    return [contextValue, updateScrollState] as const;
  }, [navTranslateY, listeners]);

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
      updateScrollState(currentOffsetY, origin);
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
