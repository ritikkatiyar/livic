import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();

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
        style={[styles.headerWrapper, { paddingTop: insets.top, minHeight: 56 + insets.top }]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>Livic</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={onNotificationPress}
            disabled={!onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={21} color={theme.Colors.onSurface} />
            <View style={styles.notificationBadge} />
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
    borderBottomColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 999,
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
    shadowColor: 'black',
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
