import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useColorScheme as useRNColorScheme, Platform, Animated, StyleSheet, LayoutAnimation, UIManager, View, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getTheme, ColorTokens, SurfaceTokens, Typography, Spacing, Rounded, LightColors, Borders, BlurIntensity, IconSizes, Shadows, Timing } from './Theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppTheme {
  Colors: ColorTokens;
  Surface: SurfaceTokens;
  Typography: typeof Typography;
  Spacing: typeof Spacing;
  Rounded: typeof Rounded;
  Timing?: typeof Timing;
  Borders: typeof Borders;
  BlurIntensity: typeof BlurIntensity;
  IconSizes: typeof IconSizes;
  Shadows: typeof Shadows;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  isInitialized: boolean;
  theme: AppTheme;
  setMode: (newMode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'tenantapp.theme_mode';

function canUseWebStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

async function readStoredThemeMode(): Promise<ThemeMode> {
  try {
    const stored = canUseWebStorage()
      ? window.localStorage.getItem(THEME_STORAGE_KEY)
      : await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (_e) {
  }
  return 'system';
}

async function saveStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    if (canUseWebStorage()) {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } else {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    }
  } catch (_e) {
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeRevealOverlay() {
  const context = useContext(ThemeContext);
  if (!context) return null;
  const { isDark, isInitialized } = context;

  const prevIsDarkRef = useRef<boolean | null>(null);
  const isFirstRenderRef = useRef<boolean>(true);
  const [transitionState, setTransitionState] = useState<{
    targetIsDark: boolean;
    oldColors: string[];
    newColors: string[];
  } | null>(null);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isInitialized) return;

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevIsDarkRef.current = isDark;
      return;
    }

    if (prevIsDarkRef.current !== null && prevIsDarkRef.current !== isDark) {
      const targetIsDark = isDark;
      const prevIsDark = prevIsDarkRef.current;

      const prevTheme = getTheme(prevIsDark);
      const targetTheme = getTheme(targetIsDark);

      if (Platform.OS !== 'web') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }

      const defaultOldColors = prevIsDark ? ['#090D12', '#0F1720', '#141E2A'] : ['#d4f5f9', '#e8f8fb', '#e2e0fb'];
      const defaultNewColors = targetIsDark ? ['#090D12', '#0F1720', '#141E2A'] : ['#d4f5f9', '#e8f8fb', '#e2e0fb'];

      setTransitionState({
        targetIsDark,
        oldColors: (prevTheme.Colors.backgroundGradient || defaultOldColors) as string[],
        newColors: (targetTheme.Colors.backgroundGradient || defaultNewColors) as string[],
      });
    }
    prevIsDarkRef.current = isDark;
  }, [isDark, isInitialized]);

  useEffect(() => {
    if (transitionState) {
      expandAnim.setValue(0);
      spinAnim.setValue(0);
      iconScaleAnim.setValue(0);
      opacityAnim.setValue(1);

      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.spring(iconScaleAnim, {
            toValue: 1.3,
            friction: 4,
            tension: 90,
            useNativeDriver: false,
          }),
          Animated.timing(iconScaleAnim, {
            toValue: 0,
            duration: 200,
            delay: 150,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }).start(() => {
          setTransitionState(null);
        });
      });
    }
  }, [transitionState, expandAnim, spinAnim, iconScaleAnim, opacityAnim]);

  if (!transitionState) return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const { width, height } = Dimensions.get('window');
  const maxDim = Math.sqrt(width * width + height * height) * 2.2;

  const circleSize = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxDim],
  });

  const circleRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxDim / 2],
  });

  const circleMargin = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -maxDim / 2],
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.overlayContainer, { opacity: opacityAnim }]}>
      <LinearGradient
        colors={transitionState.oldColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        style={[
          styles.expandingOrb,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleRadius,
            marginLeft: circleMargin,
            marginTop: circleMargin,
          },
        ]}
      >
        <LinearGradient
          colors={transitionState.newColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.energyRing,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleRadius,
            marginLeft: circleMargin,
            marginTop: circleMargin,
            borderColor: transitionState.targetIsDark ? '#38bdf8' : '#00d4ff',
            shadowColor: transitionState.targetIsDark ? '#38bdf8' : '#0072ff',
          },
        ]}
      />

      <Animated.View
        style={[
          styles.iconBadge,
          {
            backgroundColor: transitionState.targetIsDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: transitionState.targetIsDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(0, 104, 117, 0.4)',
            transform: [
              { scale: iconScaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        <MaterialIcons
          name={transitionState.targetIsDark ? 'nights-stay' : 'wb-sunny'}
          size={38}
          color={transitionState.targetIsDark ? '#38bdf8' : '#eab308'}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    readStoredThemeMode().then((storedMode) => {
      setModeState(storedMode);
      setIsInitialized(true);
    });
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await saveStoredThemeMode(newMode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    await setMode(nextMode);
  }, [mode, setMode]);

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [mode, systemColorScheme]);

  const theme = useMemo(() => {
    return getTheme(isDark);
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    isDark,
    isInitialized,
    theme,
    setMode,
    toggleTheme,
  }), [mode, isDark, isInitialized, theme, setMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={styles.container}>
        {children}
        <ThemeRevealOverlay />
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    const isDarkDefault = false;
    return {
      mode: 'system',
      isDark: isDarkDefault,
      isInitialized: true,
      theme: getTheme(isDarkDefault),
      setMode: async () => {},
      toggleTheme: async () => {},
    };
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlayContainer: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999999,
    elevation: 9999999,
    overflow: 'hidden',
  },
  expandingOrb: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    overflow: 'hidden',
  },
  energyRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderWidth: 4,
    elevation: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
  },
  iconBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -39,
    marginTop: -39,
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 24,
    shadowColor: LightColors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
});
