import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeModeControl } from '@/src/components/common/inputs/ThemeModeControl';
import type { ThemeMode } from '@/src/theme/ThemeContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { Theme } from '@/src/theme/Theme';

interface MobileMoreSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

export default function MobileMoreSheet({ visible, onClose }: MobileMoreSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { canRoute } = usePermissions();
  const { theme, isDark, setMode } = useAppTheme();
  // The sheet runs under the gesture bar (edge to edge); its last row must clear it
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // Only sections the tab bar doesn't already show, most used first. The bar drops tabs a member
  // can't open, so the sheet never needs to repeat Portfolio, Leases, Finance or Issues.
  const MENU_ITEMS: MenuItem[] = React.useMemo(() => ([
    { title: 'Mess Menu', subtitle: 'Weekly Meals', route: '/mess', icon: 'restaurant-menu', color: theme.Colors.tertiary },
    { title: 'Announcements', subtitle: 'Broadcast Messages', route: '/announcements', icon: 'campaign', color: theme.Colors.primary },
    { title: 'Inventory', subtitle: 'Assets & Stock', route: '/inventory', icon: 'inventory-2', color: theme.Colors.tertiary },
    { title: 'Reports', subtitle: 'Statements & Logs', route: '/reports', icon: 'assessment', color: theme.Colors.secondary },
    { title: 'Analytics', subtitle: 'Revenue & Occupancy', route: '/analytics', icon: 'insights', color: theme.Colors.primary },
    { title: 'Settings', subtitle: 'Team, Profile & App Config', route: '/settings', icon: 'settings', color: theme.Colors.onSurfaceVariant },
  ] satisfies MenuItem[]).filter((item) => canRoute(item.route)), [theme, canRoute]);
  
  const translateY = useRef(new Animated.Value(300)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const openSheet = () => {
    translateY.setValue(300);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 3,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: 500,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    closeSheet();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  // The theme change plays a full-screen transition, so the sheet gets out of its way first
  const handleThemeSelect = (mode: ThemeMode) => {
    closeSheet();
    setTimeout(() => {
      setMode(mode);
    }, 180);
  };

  const confirmLogout = () => {
    const message = 'You will need to sign in again to use Livic Landlord.';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) handleLogout();
      return;
    }
    Alert.alert('Log out?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const handleLogout = async () => {
    await signOut();
    closeSheet();
    router.replace('/login');
  };

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={closeSheet} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Drag Handle Slit */}
          <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.7} onPress={closeSheet} style={styles.dragTouchZone}>
              <View style={styles.dragHandle} />
            </TouchableOpacity>
          </View>

          {/* User Profile Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'L'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.fullName || 'Landlord'}</Text>
                <Text style={styles.profileRole}>{user?.email || 'Admin User'}</Text>
              </View>
            </View>
            <View style={styles.themeRow}>
              <ThemeModeControl onSelect={handleThemeSelect} />
            </View>

          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.gridCard, isActive && styles.gridCardActive]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '1A' }]}>
                    <MaterialIcons name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Subscription Upgrade Plan Banner: below the sections, so daily tools come first */}
            {canRoute('/billing') && (
            <TouchableOpacity
              style={styles.upgradeBannerWrapper} 
              activeOpacity={0.85}
              onPress={() => handleNavigate('/billing')}
            >
              <View style={styles.upgradeBannerGradient}>
                <View style={styles.upgradeBannerContent}>
                  <MaterialIcons name="workspace-premium" size={22} color={theme.Colors.onPrimaryContainer} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeBannerTitle}>UPGRADE SUBSCRIPTION</Text>
                    <Text style={styles.upgradeBannerSub}>Manage plans, memberships & limits</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.Colors.onPrimaryContainer} />
                </View>
              </View>
            </TouchableOpacity>
            )}

            {/* Explicit Logout Card for Mobile Sheet */}
            <TouchableOpacity
              style={[
                styles.gridCard,
                {
                  width: '100%',
                  backgroundColor: theme.Colors.error + '12',
                  borderColor: theme.Colors.error + '35',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  marginTop: 4,
                },
              ]}
              onPress={confirmLogout}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.Colors.error + '25' }]}>
                <MaterialIcons name="logout" size={24} color={theme.Colors.error} />
              </View>
              <View style={[styles.cardContent, { flex: 1 }]}>
                <Text style={[styles.cardTitle, { color: theme.Colors.error, fontWeight: '600', fontSize: theme.Typography.bodyLg.fontSize }]}>Log Out</Text>
                <Text style={styles.cardSubtitle}>Sign out securely from Livic Landlord</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={theme.Colors.error} />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.Colors.scrim || theme.Colors.scrim,
  },
  sheetContainer: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    maxHeight: '85%',
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragTouchZone: {
    paddingVertical: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.lg,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.Colors.outlineVariant,
  },
  sheetHeader: {
    paddingHorizontal: theme.Spacing.lg,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.Spacing.md,
  },
  avatarText: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  profileRole: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  themeRow: {
    marginTop: theme.Spacing.md,
  },
  gridContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    gap: 10,
  },
  gridCardActive: {
    backgroundColor: theme.Colors.primaryContainer,
    borderColor: theme.Colors.primary,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    gap: 2,
  },
  cardTitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  cardTitleActive: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  upgradeBannerWrapper: {
    width: '100%',
    marginTop: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeBannerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Colors.primaryTint,
    backgroundColor: theme.Colors.primaryContainer,
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upgradeBannerTitle: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onPrimaryContainer,
    letterSpacing: 1,
  },
  upgradeBannerSub: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 1,
  },
});
