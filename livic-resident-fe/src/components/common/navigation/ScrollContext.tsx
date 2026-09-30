import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { usePathname } from 'expo-router';

interface ScrollContextProps {
  navTranslateY: Animated.Value;
  handleScroll: (event: any) => void;
  resetNav: () => void;
}

const ScrollContext = createContext<ScrollContextProps | undefined>(undefined);

/** `dataSet={{ navScroll: NAV_SCROLL_IGNORE }}` on an overlay keeps its scrolling from hiding the bottom bar (web). */
export const NAV_SCROLL_IGNORE = 'ignore';

export const useScrollNav = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    return {
      navTranslateY: new Animated.Value(0),
      handleScroll: () => {},
      resetNav: () => {},
    };
  }
  return context;
};

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const navTranslateY = useRef(new Animated.Value(0)).current;
  const lastOffsetY = useRef(0);
  const pathname = usePathname();

  const resetNav = () => {
    Animated.timing(navTranslateY, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    lastOffsetY.current = 0;
  };

  // Reset navigation bar & AI icon position smoothly whenever screen route changes
  useEffect(() => {
    resetNav();
  }, [pathname]);

  const updateScrollState = (currentOffsetY: number) => {
    if (currentOffsetY <= 10) {
      Animated.timing(navTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      lastOffsetY.current = currentOffsetY;
      return;
    }

    const diff = currentOffsetY - lastOffsetY.current;

    if (diff > 4) {
      Animated.timing(navTranslateY, {
        toValue: 120,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      lastOffsetY.current = currentOffsetY;
    } else if (diff < -4) {
      Animated.timing(navTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      lastOffsetY.current = currentOffsetY;
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebScroll = (e: any) => {
        const target = e.target;
        // Scrolling inside an overlay such as Livi's chat is not the page moving
        if (target instanceof Element && target.closest(`[data-nav-scroll="${NAV_SCROLL_IGNORE}"]`)) return;
        const currentOffsetY =
          target && target !== document && target.scrollTop !== undefined
            ? target.scrollTop
            : window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

        updateScrollState(currentOffsetY);
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
    const currentOffsetY = event.nativeEvent.contentOffset?.y ?? event.nativeEvent.scrollTop ?? 0;
    updateScrollState(currentOffsetY);
  };

  return (
    <ScrollContext.Provider value={{ navTranslateY, handleScroll, resetNav }}>
      {children}
    </ScrollContext.Provider>
  );
};

