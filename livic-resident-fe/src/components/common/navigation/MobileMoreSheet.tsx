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
import { withAlpha } from '@/src/theme/colorUtils';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useMyMessMenu } from '@/src/features/mess/hooks/useMyMessMenu';

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
  const { user, signOut, accessToken } = useAuth();
  const { theme, isDark, setMode } = useAppTheme();
  // The sheet runs under the gesture bar (edge to edge); its last row must clear it
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  // Shown only where the property shares a mess menu; a failed load simply leaves it out
  const messEnabled = useMyMessMenu(accessToken).data?.enabled ?? false;

  // Only sections the tab bar doesn't already show (Home, Payments and Requests are tabs), most used first
  const MENU_ITEMS: MenuItem[] = React.useMemo(() => [
    ...(messEnabled
      ? [{ title: 'Mess Menu', subtitle: 'Weekly Meals', route: '/tenant-mess', icon: 'restaurant-menu' as const, color: theme.Colors.tertiary }]
      : []),
    { title: 'My Property', subtitle: 'Lease & Building', route: '/tenant-property', icon: 'apartment', color: theme.Colors.secondary },
    { title: 'Items & Assets', subtitle: 'Furnishings & Inventory', route: '/tenant-inventory', icon: 'inventory', color: theme.Colors.tertiary },
    { title: 'Settings', subtitle: 'Profile & App Config', route: '/settings', icon: 'settings', color: theme.Colors.onSurfaceVariant },
  ], [theme, messEnabled]);

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

  const confirmLogout = () => {
    const message = 'You will need to sign in again to use Livic.';
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

  // The theme change plays a full-screen transition, so the sheet gets out of its way first
  const handleThemeSelect = (mode: ThemeMode) => {
    closeSheet();
    setTimeout(() => {
      setMode(mode);
    }, 150);
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
                <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'R'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.fullName || 'Resident'}</Text>
                <Text style={styles.profileRole}>{user?.email || 'Tenant User'}</Text>
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

            {/* Log out is a labelled row at the end, as in the admin app, not an icon by the theme control */}
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={confirmLogout}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <View style={styles.logoutIconBox}>
                <MaterialIcons name="logout" size={24} color={theme.Colors.error} />
              </View>
              <View style={[styles.cardContent, { flex: 1 }]}>
                <Text style={styles.logoutTitle}>Log Out</Text>
                <Text style={styles.cardSubtitle}>Sign out of Livic on this phone</Text>
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
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.4)',
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
    shadowColor: 'black',
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
  logoutRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.Colors.error, 0.21),
    backgroundColor: withAlpha(theme.Colors.error, 0.07),
  },
  logoutIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.Colors.error, 0.15),
  },
  logoutTitle: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.error,
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
});
