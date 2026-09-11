import { TextStyle } from 'react-native';

export const LightColors = {
  surfaceContainerLow: "#edf5f7",
  onPrimaryFixed: "#002024",
  primaryContainer: "rgba(0, 104, 117, 0.10)",
  surfaceTint: "#006875",
  primaryFixed: "#9cecf8",
  onBackground: "#151d1e",
  inverseOnSurface: "#f1f1f1",
  outline: "#6f797b",
  tertiaryContainer: "#ffe3a2",
  onSecondaryFixedVariant: "#4346b8",
  secondaryContainer: "#e1e0ff",
  tertiaryFixedDim: "#e4b418",
  onTertiaryFixed: "#251a00",
  secondaryFixedDim: "#c0c1ff",
  error: "#ba1a1a",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#e2e8e9",
  inversePrimary: "#4fd8eb",
  tertiaryFixed: "#ffdf96",
  onSurfaceVariant: "#6b7a7d",
  onSecondaryContainer: "#161875",
  outlineVariant: "#bfc8ca",
  secondaryFixed: "#e1e0ff",
  onErrorContainer: "#410002",
  surfaceDim: "#d5dbdd",
  surfaceContainer: "#eceeef",
  onTertiaryFixedVariant: "#594400",
  surfaceBright: "#f3fbfc",
  onTertiaryContainer: "#251a00",
  onPrimary: "#ffffff",
  onSurface: "#171c1e",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  background: "#f3fbfc",
  surfaceContainerHigh: "#e7eeef",
  onPrimaryFixedVariant: "#004f59",
  onSecondary: "#ffffff",
  onPrimaryContainer: "#001f24",
  onSecondaryFixed: "#00015c",
  secondary: "#5b5ecf",
  surfaceVariant: "#dbe4e6",
  surface: "#f3fbfc",
  primaryFixedDim: "#4fd8eb",
  inverseSurface: "#2b3133",
  tertiary: "#775a00",
  primary: "#006875",
  onTertiary: "#ffffff",
  glassFill: 'rgba(255, 255, 255, 0.65)',
  glassStroke: 'rgba(255, 255, 255, 0.85)',
  accentGradientStart: "#00e0ff",
  accentGradientEnd: "#0070ea",
  backgroundGradient: ["#d4f5f9", "#e8f8fb", "#e2e0fb"] as [string, string, ...string[]],
  scrollbarThumb: "rgba(0, 104, 117, 0.20)",
  scrollbarThumbHover: "rgba(0, 104, 117, 0.40)",
  modalOverlayBackground: "rgba(15, 23, 42, 0.30)",
};

export const DarkColors = {
  surfaceContainerLow: "#0E151D",
  onPrimaryFixed: "#00E5FF",
  primaryContainer: "rgba(0, 229, 255, 0.15)",
  surfaceTint: "#00E5FF",
  primaryFixed: "#00363D",
  onBackground: "#F8FAFC",
  inverseOnSurface: "#090D12",
  outline: "#334155",
  tertiaryContainer: "#3D3000",
  onSecondaryFixedVariant: "#C0C1FF",
  secondaryContainer: "#2D2F9E",
  tertiaryFixedDim: "#F3BF26",
  onTertiaryFixed: "#FFDF96",
  secondaryFixedDim: "#2D2F9E",
  error: "#FF6B6B",
  surfaceContainerLowest: "#0D1520",
  surfaceContainerHighest: "#1E293B",
  inversePrimary: "#006875",
  tertiaryFixed: "#594400",
  onSurfaceVariant: "#94A3B8",
  onSecondaryContainer: "#E1E0FF",
  outlineVariant: "#1E293B",
  secondaryFixed: "#2D2F9E",
  onErrorContainer: "#FFDAD6",
  surfaceDim: "#0D131A",
  surfaceContainer: "#121A22",
  onTertiaryFixedVariant: "#FFDF96",
  surfaceBright: "#1B2633",
  onTertiaryContainer: "#FFDF96",
  onPrimary: "#001F24",
  onSurface: "#F8FAFC",
  onError: "#600008",
  errorContainer: "#600008",
  background: "#090D12",
  surfaceContainerHigh: "#1B2633",
  onPrimaryFixedVariant: "#80F4FF",
  onSecondary: "#161875",
  onPrimaryContainer: "#00E5FF",
  onSecondaryFixed: "#E1E0FF",
  secondary: "#8285FF",
  surfaceVariant: "#141D26",
  surface: "#0F1720",
  primaryFixedDim: "#00E5FF",
  inverseSurface: "#141E2A",
  tertiary: "#F3BF26",
  primary: "#00E5FF",
  onTertiary: "#251A00",
  glassFill: 'rgba(15, 23, 32, 0.88)',
  glassStroke: 'rgba(255, 255, 255, 0.14)',
  accentGradientStart: "#00E5FF",
  accentGradientEnd: "#0070EA",
  backgroundGradient: ["#090D12", "#0F1720", "#141E2A"] as [string, string, ...string[]],
  scrollbarThumb: "rgba(0, 229, 255, 0.20)",
  scrollbarThumbHover: "rgba(0, 229, 255, 0.40)",
  modalOverlayBackground: "rgba(15, 23, 42, 0.50)",
};

export const Colors = LightColors;

export const LightSurface = {
  card: '#FFFFFF',
  cardElevated: '#FAFBFC',
  cardMuted: '#F5F7F8',
  page: '#F3FBFC',
  pageAlt: '#F0F2F5',
  border: '#E8ECEF',
  borderLight: '#F0F2F4',
  borderFocus: '#006875',
  overlay: 'rgba(0, 15, 20, 0.45)',
  shadowColor: '#003040',
};

export const DarkSurface = {
  card: '#131C26',
  cardElevated: '#182432',
  cardMuted: '#0E151D',
  page: '#090D12',
  pageAlt: '#0C121A',
  border: '#202D3D',
  borderLight: '#17222F',
  borderFocus: '#00E5FF',
  overlay: 'rgba(0, 0, 0, 0.75)',
  shadowColor: '#000000',
};

export const Surface = LightSurface;

export interface TypographyStyle extends Omit<TextStyle, 'fontWeight'> {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight: number;
  letterSpacing?: number;
}

export const SerifHeadlineFont = 'Playfair Display, Georgia, "Times New Roman", serif';
export const SansFont = 'Inter, sans-serif';

export const Fonts = {
  headline: SerifHeadlineFont,
  serifHeadline: SerifHeadlineFont,
  playfairDisplay: 'Playfair Display',
  body: 'Inter',
  inter: 'Inter',
  mono: 'JetBrains Mono',
  sans: SansFont,
} as const;

export const Typography = {
  displayLarge: {
    fontFamily: SerifHeadlineFont,
    fontSize: 57,
    fontWeight: '800' as const,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: SerifHeadlineFont,
    fontSize: 45,
    fontWeight: '800' as const,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: SerifHeadlineFont,
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: SerifHeadlineFont,
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: SerifHeadlineFont,
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: SerifHeadlineFont,
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: SerifHeadlineFont,
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  displayMetrics: {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
  },
  headlineXl: {
    fontFamily: SerifHeadlineFont,
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
  },
  headlineLg: {
    fontFamily: SerifHeadlineFont,
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
  headlineMd: {
    fontFamily: SerifHeadlineFont,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  bodyLg: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  labelCaps: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800' as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  labelMuted: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    color: '#94A3B8',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  stackSm: 8,
  stackMd: 16,
  stackLg: 24,
  containerPadding: 24,
  unit: 8,
  gutter: 16,
};

export const Rounded = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  default: 12,
};

export const Timing = {
  quick: 150,
  normal: 220,
  smooth: 300,
  slow: 500,
} as const;

export const AnimationDuration = Timing.normal;

export type ColorTokens = typeof LightColors;
export type SurfaceTokens = typeof LightSurface;

export function getTheme(isDark: boolean) {
  return {
    Colors: isDark ? DarkColors : LightColors,
    Surface: isDark ? DarkSurface : LightSurface,
    Typography,
    Fonts,
    Spacing,
    Rounded,
    Timing,
  };
}

export const Theme = {
  Colors,
  Surface,
  Typography,
  Fonts,
  Spacing,
  Rounded,
  Timing,
};

export const Breakpoints = {
  mobile: 0,
  tablet: 600,
  desktop: 900,
};
