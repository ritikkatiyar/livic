import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface BottomNavigationProps {
  onMorePress: () => void;
  onQRPress?: () => void;
}

interface NavTabItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  isActive: (pathname: string) => boolean;
}

export default function BottomNavigation({ onMorePress }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const navItems: NavTabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'apartment',
      route: '/command-center',
      isActive: (path) => path === '/command-center' || path === '/' || path.startsWith('/properties'),
    },
    {
      id: 'leases',
      label: 'Leases',
      icon: 'receipt-long',
      route: '/leases',
      isActive: (path) => path === '/leases' || path.startsWith('/leases'),
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'payments',
      route: '/expenses/rent-roll',
      isActive: (path) => path.startsWith('/expenses') || path === '/billing',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: 'report-problem',
      route: '/escalations',
      isActive: (path) => path === '/escalations' || path.startsWith('/escalations'),
    },
  ];

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mobile-bottom-nav-container {
            position: fixed !important;
            bottom: 16px !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
          }
          @media (min-width: 900px) {
            .mobile-bottom-nav-container {
              display: none !important;
            }
          }
        `}} />
      )}
      <View
        // @ts-ignore
        dataSet={{ bottomNav: 'true', responsiveLayout: 'mobile' }}
        className="mobile-bottom-nav-container"
        style={styles.outerContainer}
        pointerEvents="box-none"
      >
        <View style={styles.pillContainer}>
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => {
                  if (!active) router.push(item.route as any);
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.iconCircle, active && { backgroundColor: `${theme.Colors.primary}18` }]}>
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={active ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                  />
                </View>
                <Text
                  style={[
                    styles.navText,
                    { color: active ? theme.Colors.primary : theme.Colors.onSurfaceVariant },
                    active && styles.navTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* More Drawer Sheet Trigger */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={onMorePress}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="grid-view" size={20} color={theme.Colors.onSurfaceVariant} />
            </View>
            <Text style={[styles.navText, { color: theme.Colors.onSurfaceVariant }]} numberOfLines={1}>
              More
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    paddingHorizontal: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 32,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: theme.Colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 440,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
    gap: 2,
    minHeight: 44,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  navTextActive: {
    fontWeight: '600',
  },
});
