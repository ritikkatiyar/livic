import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { NavigationContext } from '@react-navigation/native';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppChromeInsets } from '@/src/components/common/layout/AppChrome';


// Widest a page's content grows on a tablet, beside the navigation rail
const TABLET_CONTENT_MAX_WIDTH = 720;
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
  // Measured by the app shell (header, bottom bar, assistant); zero on screens without chrome
  const chrome = useAppChromeInsets();

  const mobileHeaderOffset = isDesktop ? 0 : chrome.top;
  const mobileBottomOffset = isDesktop ? 0 : Math.max(chrome.bottom, insets.bottom);

  const styles = React.useMemo(
    () => createStyles(theme, isDark, isDesktop, mobileHeaderOffset, mobileBottomOffset),
    [theme, isDark, isDesktop, mobileHeaderOffset, mobileBottomOffset]
  );

  const { handleScroll, subscribeScrollToTop } = useScrollNav();
  const scrollRef = React.useRef<ScrollView>(null);
  // Optional: screens outside a navigator (and tests) have none, and then always count as focused
  const navigation = React.useContext(NavigationContext);

  // Re-tapping the open tab scrolls the screen you're looking at back to the top
  React.useEffect(() => {
    if (!scrollable) return;
    return subscribeScrollToTop(() => {
      if (navigation && !navigation.isFocused()) return;
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [scrollable, subscribeScrollToTop, navigation]);

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
    : Math.max(mobileHeaderOffset + theme.Spacing.md, typeof customPaddingTop === 'number' ? customPaddingTop : 0);

  const customPaddingBottom = flattenedCustomStyle?.paddingBottom ?? flattenedCustomStyle?.padding;
  const effectivePaddingBottom = isDesktop
    ? (customPaddingBottom ?? 40)
    // chrome.bottom already covers the bottom bar and the assistant bubble above it
    : Math.max(mobileBottomOffset + theme.Spacing.md, typeof customPaddingBottom === 'number' ? customPaddingBottom : 0);

  // On tablets the navigation rail sits down the left edge, beside the content: add it to whatever
  // left padding the screen already asks for
  const railInset = isDesktop ? 0 : chrome.left;
  const baseLeftPadding =
    flattenedCustomStyle?.paddingLeft ?? flattenedCustomStyle?.paddingHorizontal ?? flattenedCustomStyle?.padding ?? theme.Spacing.containerPadding;
  // ...and stop growing at a readable width, so cards and buttons don't stretch across a tablet
  const railPadding =
    railInset > 0 && typeof baseLeftPadding === 'number'
      ? { paddingLeft: baseLeftPadding + railInset, maxWidth: railInset + baseLeftPadding * 2 + TABLET_CONTENT_MAX_WIDTH }
      : null;

  const resolvedScrollContentStyle = React.useMemo(() => {
    return [
      styles.scrollContent,
      contentContainerStyle,
      !isDesktop && {
        paddingTop: effectivePaddingTop,
        paddingBottom: effectivePaddingBottom,
      },
      railPadding,
    ];
  }, [styles.scrollContent, contentContainerStyle, isDesktop, effectivePaddingTop, effectivePaddingBottom, railPadding?.paddingLeft]);

  const resolvedFlatContentStyle = React.useMemo(() => {
    return [
      styles.flatContainer,
      contentContainerStyle,
      !isDesktop && {
        paddingTop: effectivePaddingTop,
        paddingBottom: effectivePaddingBottom,
      },
      railPadding,
    ];
  }, [styles.flatContainer, contentContainerStyle, isDesktop, effectivePaddingTop, effectivePaddingBottom, railPadding?.paddingLeft]);

  const container = (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {header}
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
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
