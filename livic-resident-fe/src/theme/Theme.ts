import { TextStyle } from 'react-native';

export const LightColors = {
  surfaceContainerLow: "#F2F1ED",
  onPrimaryFixed: "#002024",
  primaryContainer: "rgba(14, 79, 82, 0.10)",
  surfaceTint: "#0E4F52",
  primaryFixed: "#9cecf8",
  onBackground: "#12181B",
  inverseOnSurface: "#f1f1f1",
  outline: "#DEDCD5",
  tertiaryContainer: "#F5ECD7",
  onSecondaryFixedVariant: "#4346b8",
  secondaryContainer: "#E5EBEB",
  tertiaryFixedDim: "#e4b418",
  onTertiaryFixed: "#251a00",
  secondaryFixedDim: "#c0c1ff",
  error: "#A23E36",
  errorContainer: "#FDE8E7",
  success: "#1B5E20",
  successContainer: "#E8F5E9",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerHighest: "#E8E6E0",
  inversePrimary: "#4fd8eb",
  tertiaryFixed: "#ffdf96",
  onSurfaceVariant: "#5B6668",
  onSecondaryContainer: "#161875",
  outlineVariant: "#DEDCD5",
  secondaryFixed: "#e1e0ff",
  onErrorContainer: "#410002",
  surfaceDim: "#E3E1DA",
  surfaceContainer: "#EEEDE8",
  onTertiaryFixedVariant: "#594400",
  surfaceBright: "#FBFBFA",
  onTertiaryContainer: "#251a00",
  onPrimary: "#ffffff",
  onSurface: "#12181B",
  onError: "#ffffff",
  background: "#F7F6F3",
  surfaceContainerHigh: "#E8E6E0",
  onPrimaryFixedVariant: "#004f59",
  onSecondary: "#ffffff",
  onPrimaryContainer: "#0E4F52",
  onSecondaryFixed: "#00015c",
  secondary: "#5B6668",
  surfaceVariant: "#EEEDE8",
  surface: "#F7F6F3",
  primaryFixedDim: "#4fd8eb",
  inverseSurface: "#12181B",
  tertiary: "#8A6D3B",
  primary: "#0E4F52",
  onTertiary: "#ffffff",
  glassFill: "#FFFFFF",
  glassStroke: "#DEDCD5",
  accentGradientStart: "#0E4F52",
  accentGradientEnd: "#1A6B6F",
  backgroundGradient: ["#F7F6F3", "#F2F1ED", "#EEEDE8"] as [string, string, ...string[]],
  scrollbarThumb: "rgba(14, 79, 82, 0.20)",
  scrollbarThumbHover: "rgba(14, 79, 82, 0.40)",
  modalOverlayBackground: "rgba(18, 24, 27, 0.45)",
  scrim: "rgba(0, 0, 0, 0.45)",
};

export const DarkColors = {
  surfaceContainerLow: "#1A2124",
  onPrimaryFixed: "#4FA3A6",
  primaryContainer: "rgba(79, 163, 166, 0.15)",
  surfaceTint: "#4FA3A6",
  primaryFixed: "#00363D",
  onBackground: "#F0EFEC",
  inverseOnSurface: "#090D12",
  outline: "#2A3134",
  tertiaryContainer: "#3D3000",
  onSecondaryFixedVariant: "#C0C1FF",
  secondaryContainer: "#232A2D",
  tertiaryFixedDim: "#F3BF26",
  onTertiaryFixed: "#FFDF96",
  secondaryFixedDim: "#2D2F9E",
  error: "#D97C72",
  errorContainer: "#3D1D1B",
  success: "#81C784",
  successContainer: "rgba(129, 199, 132, 0.15)",
  surfaceContainerLowest: "#161C1F",
  surfaceContainerHighest: "#2A3134",
  inversePrimary: "#0E4F52",
  tertiaryFixed: "#594400",
  onSurfaceVariant: "#9AA3A5",
  onSecondaryContainer: "#E1E0FF",
  outlineVariant: "#2A3134",
  secondaryFixed: "#2D2F9E",
  onErrorContainer: "#FFDAD6",
  surfaceDim: "#0E1316",
  surfaceContainer: "#1E2528",
  onTertiaryFixedVariant: "#FFDF96",
  surfaceBright: "#283034",
  onTertiaryContainer: "#FFDF96",
  onPrimary: "#0E1517",
  onSurface: "#F0EFEC",
  onError: "#600008",
  background: "#12181B",
  surfaceContainerHigh: "#232A2D",
  onPrimaryFixedVariant: "#80F4FF",
  onSecondary: "#12181B",
  onPrimaryContainer: "#4FA3A6",
  onSecondaryFixed: "#E1E0FF",
  secondary: "#9AA3A5",
  surfaceVariant: "#1E2528",
  surface: "#12181B",
  primaryFixedDim: "#4FA3A6",
  inverseSurface: "#F0EFEC",
  tertiary: "#C9AB6E",
  primary: "#4FA3A6",
  onTertiary: "#251A00",
  glassFill: "#161C1F",
  glassStroke: "#2A3134",
  accentGradientStart: "#4FA3A6",
  accentGradientEnd: "#68BDC0",
  backgroundGradient: ["#12181B", "#161C1F", "#1A2124"] as [string, string, ...string[]],
  scrollbarThumb: "rgba(79, 163, 166, 0.20)",
  scrollbarThumbHover: "rgba(79, 163, 166, 0.40)",
  modalOverlayBackground: "rgba(0, 0, 0, 0.65)",
  scrim: "rgba(0, 0, 0, 0.65)",
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

export const Breakpoints = {
  mobile: 0,
  tablet: 600,
  desktop: 900,
  modalMaxWidth: 520,
};

export const Dimensions = {
  modalScrollMaxHeight: 320,
};

export const IconSizes = {
  xs: 14,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 30,
  xxl: 32,
};

export const Shadows = {
  glassCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  floatingToolbar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  low: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
};

export function getTheme(isDark: boolean) {
  return {
    Colors: isDark ? DarkColors : LightColors,
    Surface: isDark ? DarkSurface : LightSurface,
    Typography,
    Fonts,
    Spacing,
    Rounded,
    Timing,
    Breakpoints,
    Dimensions,
    IconSizes,
    Shadows,
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
  Breakpoints,
  Dimensions,
  IconSizes,
  Shadows,
};


