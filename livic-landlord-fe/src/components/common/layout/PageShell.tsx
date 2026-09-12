import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useResponsive } from '@/src/hooks/useResponsive';

interface PageShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  onScroll?: (event: any) => void;
  onEndReached?: () => void;
}

export function PageShell({
  children,
  header,
  scrollable = false,
  style,
  contentContainerStyle,
  keyboardAvoiding = false,
  edges = ['left', 'right'],
  onScroll,
  onEndReached,
}: PageShellProps) {
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  const mobileHeaderOffset = isDesktop ? 0 : (56 + (insets.top > 0 ? insets.top : 12));
  const mobileBottomOffset = isDesktop ? 0 : (68 + (insets.bottom > 0 ? insets.bottom : 12));

  const styles = React.useMemo(
    () => createStyles(theme, isDark, isDesktop, mobileHeaderOffset, mobileBottomOffset),
    [theme, isDark, isDesktop, mobileHeaderOffset, mobileBottomOffset]
  );

  const { handleScroll } = useScrollNav();

  const handleCombinedScroll = (event: any) => {
    handleScroll(event);
    if (onScroll) onScroll(event);

    if (onEndReached) {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (layoutMeasurement && contentOffset && contentSize) {
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
        if (isCloseToBottom) {
          onEndReached();
        }
      }
    }
  };

  const flattenedCustomStyle = React.useMemo(
    () => (contentContainerStyle ? (StyleSheet.flatten(contentContainerStyle) as ViewStyle) : undefined),
    [contentContainerStyle]
  );

  const customPaddingTop = flattenedCustomStyle?.paddingTop ?? flattenedCustomStyle?.padding;
  const effectivePaddingTop = isDesktop
    ? (customPaddingTop ?? 24)
    : Math.max(mobileHeaderOffset + 16, typeof customPaddingTop === 'number' ? customPaddingTop : 0);

  const customPaddingBottom = flattenedCustomStyle?.paddingBottom ?? flattenedCustomStyle?.padding;
  const effectivePaddingBottom = isDesktop
    ? (customPaddingBottom ?? 40)
    : Math.max(mobileBottomOffset + 24, typeof customPaddingBottom === 'number' ? customPaddingBottom : 0);

  const resolvedScrollContentStyle = React.useMemo(() => {
    return [
      styles.scrollContent,
      contentContainerStyle,
      !isDesktop && {
        paddingTop: effectivePaddingTop,
        paddingBottom: effectivePaddingBottom,
      },
    ];
  }, [styles.scrollContent, contentContainerStyle, isDesktop, effectivePaddingTop, effectivePaddingBottom]);

  const resolvedFlatContentStyle = React.useMemo(() => {
    return [
      styles.flatContainer,
      contentContainerStyle,
      !isDesktop && {
        paddingTop: effectivePaddingTop,
        paddingBottom: effectivePaddingBottom,
      },
    ];
  }, [styles.flatContainer, contentContainerStyle, isDesktop, effectivePaddingTop, effectivePaddingBottom]);

  const container = (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={resolvedScrollContentStyle}
          showsVerticalScrollIndicator={false}
          onScroll={handleCombinedScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={resolvedFlatContentStyle}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, height: '100%', backgroundColor: theme.Colors.background }}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {container}
        </KeyboardAvoidingView>
      ) : (
        container
      )}
    </View>
  );
}

const createStyles = (
  theme: any,
  isDark: boolean,
  isDesktop: boolean,
  mobileHeaderOffset: number,
  mobileBottomOffset: number
) =>
  StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
      height: '100%',
    },
    safeArea: {
      flex: 1,
      height: '100%',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      width: '100%',
      paddingHorizontal: isDesktop ? 32 : theme.Spacing.containerPadding,
      paddingTop: isDesktop ? 24 : (mobileHeaderOffset + 16),
      paddingBottom: isDesktop ? 40 : (mobileBottomOffset + 24),
    },
    flatContainer: {
      flex: 1,
      height: '100%',
      width: '100%',
      paddingHorizontal: isDesktop ? 32 : theme.Spacing.containerPadding,
      paddingTop: isDesktop ? 24 : (mobileHeaderOffset + 16),
      paddingBottom: isDesktop ? 40 : (mobileBottomOffset + 24),
    },
  });
