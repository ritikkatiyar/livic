import { useAppTheme } from '@/src/theme/ThemeContext';
import { RAIL_WIDTH, useLiviInTopBar } from './bottomDock';
import { useResponsive } from '@/src/hooks/useResponsive';
import { requestOpenAssistant } from './assistantEvents';
import { AssistantMascot } from './AssistantMascot';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useUnreadNoticeCount } from '@/src/features/announcements/hooks/useUnreadNoticeCount';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useScrolledUnder, useTitleScrolledAway } from './ScrollContext';
import { Motion, useReducedMotion } from '@/src/theme/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface MobileHeaderProps {
  title: string;
  onNotificationPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function MobileHeader({ title, onNotificationPress }: MobileHeaderProps) {
  const { theme, isDark } = useAppTheme();
  const { accessToken } = useAuth();
  const unreadNotices = useUnreadNoticeCount(accessToken || null);
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();
  const liviInTopBar = useLiviInTopBar();
  const { isTablet } = useResponsive();
  // Once the page's own heading scrolls away, the bar shows the page name instead of the wordmark
  const titleScrolledAway = useTitleScrolledAway();
  // At the top the bar sits flat on the page; once content passes under it, its edge appears
  const scrolledUnder = useScrolledUnder();
  const showPageTitle = title !== 'Livic' && titleScrolledAway;
  const reduceMotion = useReducedMotion();
  const titleProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(titleProgress, {
      toValue: showPageTitle ? 1 : 0,
      duration: reduceMotion ? 0 : Motion.duration.quick,
      easing: Motion.easeOut,
      useNativeDriver: Motion.nativeDriver,
    }).start();
  }, [showPageTitle, reduceMotion, titleProgress]);

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mobile-header-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
          }
          @media (min-width: 900px) {
            .mobile-header-container {
              display: none !important;
            }
          }
        `}} />
      )}
      <View
        // @ts-ignore
        dataSet={{ mobileHeader: 'true', responsiveLayout: 'mobile' }}
        className="mobile-header-container"
        style={[styles.headerWrapper, scrolledUnder && styles.headerWrapperScrolled, { paddingTop: insets.top, minHeight: 56 + insets.top }]}
      >
        <View style={[styles.headerContainer, isTablet && { paddingLeft: RAIL_WIDTH + theme.Spacing.md }]}>
          <View style={styles.brandContainer}>
            <Animated.Text style={[styles.brandText, { opacity: titleProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
              Livic
            </Animated.Text>
            <Animated.Text
              style={[styles.compactTitle, { opacity: titleProgress }]}
              numberOfLines={1}
              pointerEvents="none"
              accessibilityElementsHidden={!showPageTitle}
              importantForAccessibility={showPageTitle ? 'auto' : 'no-hide-descendants'}
            >
              {title}
            </Animated.Text>
          </View>

          {/* On narrow screens and with large text, Livi sits here beside the bell */}
          {liviInTopBar ? (
            <TouchableOpacity
              style={styles.liviButton}
              activeOpacity={0.75}
              onPress={requestOpenAssistant}
              accessibilityRole="button"
              accessibilityLabel="Ask Livi, AI assistant"
            >
              <AssistantMascot size={36} color={theme.Colors.surfaceContainerHigh} featureColor={theme.Colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onNotificationPress}
            disabled={!onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={unreadNotices > 0 ? `Notifications, ${unreadNotices} unread` : 'Notifications'}
          >
            <Ionicons name="notifications-outline" size={21} color={theme.Colors.onSurface} />
            {/* Lit only while a notice is unread, so the dot always means something */}
            {unreadNotices > 0 ? <View style={styles.notificationBadge} /> : null}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 12,
    elevation: 0,
    zIndex: 999,
  },
  headerWrapperScrolled: {
    borderBottomColor: theme.Colors.outlineVariant,
    shadowOpacity: isDark ? 0.3 : 0.06,
    elevation: 4,
  },
  headerContainer: {
    height: 56,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  brandContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  liviButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compactTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  brandText: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: -0.3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.error || '#ba1a1a',
  },
});
