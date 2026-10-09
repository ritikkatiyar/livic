import { TextStyle, Platform } from 'react-native';

export const LightColors = {
  surfaceContainerLow: "#F2F1ED",
  onPrimaryFixed: "#002024",
  // The light-teal tier (selected chips, hero cards), between the page and solid teal
  primaryContainer: "#D2E7E5",
  surfaceTint: "#0E4F52",
  primaryFixed: "#9cecf8",
  onBackground: "#12181B",
  inverseOnSurface: "#f1f1f1",
  outline: "#D6D3CA",
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
  surfaceContainerHighest: "#DAD8D0",
  inversePrimary: "#4fd8eb",
  tertiaryFixed: "#ffdf96",
  onSurfaceVariant: "#525D5F",
  onSecondaryContainer: "#161875",
  outlineVariant: "#E4E2DB",
  secondaryFixed: "#e1e0ff",
  onErrorContainer: "#410002",
  surfaceDim: "#DEDCD4",
  surfaceContainer: "#EAE8E3",
  onTertiaryFixedVariant: "#594400",
  surfaceBright: "#FBFBFA",
  onTertiaryContainer: "#251a00",
  onPrimary: "#ffffff",
  onSurface: "#12181B",
  onError: "#ffffff",
  background: "#EFEEE9",
  surfaceContainerHigh: "#E3E1DA",
  onPrimaryFixedVariant: "#004f59",
  onSecondary: "#ffffff",
  onPrimaryContainer: "#0B3A3C",
  onSecondaryFixed: "#00015c",
  secondary: "#525D5F",
  surfaceVariant: "#EAE8E3",
  surface: "#EFEEE9",
  primaryFixedDim: "#4fd8eb",
  inverseSurface: "#12181B",
  tertiary: "#75592B",
  primary: "#0E4F52",
  onTertiary: "#ffffff",
  glassFill: "#FFFFFF",
  glassStroke: "#D6D3CA",
  accentGradientStart: "#0E4F52",
  accentGradientEnd: "#1A6B6F",
  backgroundGradient: ["#EFEEE9", "#EFEEE9", "#EAE8E3"] as [string, string, ...string[]],
  scrollbarThumb: "rgba(14, 79, 82, 0.20)",
  scrollbarThumbHover: "rgba(14, 79, 82, 0.40)",
  modalOverlayBackground: "rgba(18, 24, 27, 0.45)",
  scrim: "rgba(0, 0, 0, 0.32)",
  // Borders for inputs and other controls that must meet 3:1 against card and page
  outlineStrong: "#777F7C",
  // Placeholder text: readable (4.5:1+) but clearly lighter than typed text
  placeholder: "#626B6D",
  shadowColor: "#000000",
  // Stronger status tints for resting 3D units, which sit on a neutral backdrop
  primaryTint: "rgba(14, 79, 82, 0.32)",
  tertiaryTint: "rgba(117, 89, 43, 0.28)",
};

export const DarkColors = {
  surfaceContainerLow: "#232C30",
  onPrimaryFixed: "#5EB1B4",
  // The light-teal tier (selected chips, hero cards). Kept dark enough that teal text on it passes 4.5:1
  primaryContainer: "#1A3D3F",
  surfaceTint: "#5EB1B4",
  primaryFixed: "#00363D",
  onBackground: "#F0EFEC",
  inverseOnSurface: "#090D12",
  outline: "#3A4549",
  tertiaryContainer: "#3D3000",
  onSecondaryFixedVariant: "#C0C1FF",
  secondaryContainer: "#232A2D",
  tertiaryFixedDim: "#F3BF26",
  onTertiaryFixed: "#FFDF96",
  secondaryFixedDim: "#2D2F9E",
  error: "#E8958B",
  errorContainer: "#3D1D1B",
  success: "#81C784",
  successContainer: "rgba(129, 199, 132, 0.15)",
  surfaceContainerLowest: "#1C2428",
  surfaceContainerHighest: "#323D43",
  inversePrimary: "#0E4F52",
  tertiaryFixed: "#594400",
  onSurfaceVariant: "#A3ACAE",
  onSecondaryContainer: "#E1E0FF",
  outlineVariant: "#2C3639",
  secondaryFixed: "#2D2F9E",
  onErrorContainer: "#FFDAD6",
  surfaceDim: "#0B0F11",
  surfaceContainer: "#283236",
  onTertiaryFixedVariant: "#FFDF96",
  surfaceBright: "#39454A",
  onTertiaryContainer: "#FFDF96",
  onPrimary: "#0E1517",
  onSurface: "#F0EFEC",
  onError: "#3B0A06",
  background: "#0F1417",
  surfaceContainerHigh: "#2E393D",
  onPrimaryFixedVariant: "#80F4FF",
  onSecondary: "#12181B",
  onPrimaryContainer: "#CDEAE9",
  onSecondaryFixed: "#E1E0FF",
  secondary: "#A3ACAE",
  surfaceVariant: "#283236",
  surface: "#0F1417",
  primaryFixedDim: "#5EB1B4",
  inverseSurface: "#F0EFEC",
  tertiary: "#C9AB6E",
  primary: "#5EB1B4",
  onTertiary: "#251A00",
  glassFill: "#1C2428",
  glassStroke: "#3A4549",
  accentGradientStart: "#5EB1B4",
  accentGradientEnd: "#68BDC0",
  backgroundGradient: ["#0F1417", "#0F1417", "#141A1D"] as [string, string, ...string[]],
  scrollbarThumb: "rgba(94, 177, 180, 0.20)",
  scrollbarThumbHover: "rgba(94, 177, 180, 0.40)",
  modalOverlayBackground: "rgba(0, 0, 0, 0.65)",
  scrim: "rgba(0, 0, 0, 0.5)",
  outlineStrong: "#6E7A7C",
  // Placeholder text: readable (4.5:1+) but clearly lighter than typed text
  placeholder: "#8E989A",
  shadowColor: "#000000",
  primaryTint: "rgba(94, 177, 180, 0.45)",
  tertiaryTint: "rgba(201, 171, 110, 0.40)",
};

export const Colors = LightColors;

export interface TypographyStyle extends Omit<TextStyle, 'fontWeight'> {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight: number;
  letterSpacing?: number;
}

export const AppleFont = Platform.select({
  ios: 'System',
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
  android: 'Roboto',
  default: 'System',
}) as string;

export const SerifHeadlineFont = AppleFont;
export const SansFont = AppleFont;

export const Fonts = {
  headline: AppleFont,
  serifHeadline: AppleFont,
  playfairDisplay: AppleFont,
  body: AppleFont,
  inter: AppleFont,
  mono: Platform.select({
    ios: 'SF Mono',
    web: 'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace',
    default: 'monospace',
  }) as string,
  sans: AppleFont,
  apple: AppleFont,
} as const;

export const Typography = {
  displayLarge: {
    fontFamily: AppleFont,
    fontSize: 48,
    fontWeight: '600' as const,
    lineHeight: 56,
  },
  displayMedium: {
    fontFamily: AppleFont,
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
  },
  displaySmall: {
    fontFamily: AppleFont,
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
  },
  headlineLarge: {
    fontFamily: AppleFont,
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  headlineMedium: {
    fontFamily: AppleFont,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  headlineSmall: {
    fontFamily: AppleFont,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  titleLarge: {
    fontFamily: AppleFont,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  titleMedium: {
    fontFamily: AppleFont,
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: AppleFont,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontFamily: AppleFont,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: AppleFont,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: AppleFont,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontFamily: AppleFont,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: AppleFont,
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: AppleFont,
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  displayMetrics: {
    fontFamily: AppleFont,
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
  },
  headlineXl: {
    fontFamily: AppleFont,
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
  },
  headlineLg: {
    fontFamily: AppleFont,
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  headlineMd: {
    fontFamily: AppleFont,
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: AppleFont,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  bodyMd: {
    fontFamily: AppleFont,
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  labelCaps: {
    fontFamily: AppleFont,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelMuted: {
    fontFamily: AppleFont,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    color: '#94A3B8',
  },
  buttonText: {
    fontFamily: AppleFont,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.3,
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

export const Borders = {
  unit: 0.5,
  thin: 1,
  card: 1,
  default: 1,
  thick: 2,
};

export const BlurIntensity = {
  light: 20,
  medium: 35,
  modalOverlay: 40,
  heavy: 60,
};

export const IconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
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
};

export type ColorTokens = typeof LightColors;

export function getTheme(isDark: boolean) {
  return {
    Colors: isDark ? DarkColors : LightColors,
    Typography,
    Fonts,
    Spacing,
    Rounded,
    Timing,
    Borders,
    BlurIntensity,
    IconSizes,
    Shadows,
  };
}

export const Theme = {
  Colors,
  Typography,
  Fonts,
  Spacing,
  Rounded,
  Timing,
  Borders,
  BlurIntensity,
  IconSizes,
  Shadows,
};

export const Breakpoints = {
  mobile: 0,
  tablet: 600,
  desktop: 900,
};
