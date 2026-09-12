import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Alert, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_CONFIG: Record<ToastType, {
  icon: string;
  gradientColors: readonly [string, string];
  accentColor: string;
  glowColor: string;
}> = {
  success: {
    icon: 'check-circle',
    gradientColors: ['#059669', '#10b981'],
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    icon: 'cancel',
    gradientColors: ['#dc2626', '#ef4444'],
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: 'warning-amber',
    gradientColors: ['#d97706', '#f59e0b'],
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: 'info',
    gradientColors: ['#0891b2', '#06b6d4'],
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
};

function ToastItem({
  toast,
  fadeAnim,
  slideAnim,
  onDismiss,
}: {
  toast: ToastMessage;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const config = TOAST_CONFIG[toast.type];
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          bottom: Math.max(insets.bottom + 16, 32),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Glow shadow effect */}
      <View style={[styles.glowLayer, { backgroundColor: config.glowColor }]} />

      <View style={styles.toastBlur}>
        <View style={[styles.accentStripe, { backgroundColor: config.accentColor }]} />
        <View style={[styles.iconCircle, { backgroundColor: `${config.accentColor}18` }]}>
          <MaterialIcons name={config.icon as any} size={22} color={config.accentColor} />
        </View>
        <View style={styles.textBlock}>
          {toast.title && (
            <Text style={[styles.toastTitle, { color: config.accentColor }]} numberOfLines={1}>
              {toast.title}
            </Text>
          )}
          <Text style={styles.toastMessage} numberOfLines={3}>{toast.message}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const timerRef = useRef<any>(null);
  const originalAlertRef = useRef(Alert.alert);
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  interface ConfirmButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void | Promise<void>;
  }

  interface ConfirmDialogState {
    title: string;
    message: string;
    buttons: ConfirmButton[];
  }

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 60, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start(() => setToast(null));
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (Platform.OS !== 'web') {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }

    // Auto-derive title if not provided
    const autoTitle = title ?? (
      type === 'success' ? 'Success' :
      type === 'error' ? 'Something went wrong' :
      type === 'warning' ? 'Heads up' :
      'Notice'
    );

    setToast({ id: Math.random().toString(), message, type, title: autoTitle });

    fadeAnim.setValue(0);
    slideAnim.setValue(60);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 11 }),
    ]).start();

    const duration = type === 'error' ? 5000 : 3500;
    timerRef.current = setTimeout(hideToast, duration);
  }, [fadeAnim, slideAnim, hideToast]);

  // Intercept Alert.alert globally so every screen benefits
  useEffect(() => {
    Alert.alert = (title: any, message?: any, buttons?: any, options?: any) => {
      const msg = message || (typeof title === 'string' ? title : '');
      const titleStr = typeof title === 'string' ? title : '';
      const isConfirmation = buttons && buttons.length > 1;

      if (isConfirmation) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        setConfirmDialog({
          title: titleStr,
          message: msg,
          buttons: buttons
        });
      } else {
        const lc = (titleStr + msg).toLowerCase();
        const type: ToastType =
          lc.includes('error') || lc.includes('fail') || lc.includes('wrong') ? 'error' :
          lc.includes('warn') ? 'warning' :
          'success';
        showToast(msg, type, titleStr || undefined);

        const okButton = buttons?.[0];
        if (okButton?.onPress) {
          const fn = okButton.onPress;
          setTimeout(() => fn(), 1400);
        }
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert = (message: string) => {
        const lc = message?.toLowerCase() || '';
        const type: ToastType =
          lc.includes('error') || lc.includes('fail') ? 'error' :
          lc.includes('warn') ? 'warning' :
          'success';
        showToast(message, type);
      };
    }

    return () => { Alert.alert = originalAlertRef.current; };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <ToastItem
          toast={toast}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          onDismiss={hideToast}
        />
      )}
      {confirmDialog && (
        <Modal
          transparent
          animationType="fade"
          visible={!!confirmDialog}
          onRequestClose={() => setConfirmDialog(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.4)' }]} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{confirmDialog.title}</Text>
              <Text style={styles.modalMessage}>{confirmDialog.message}</Text>
              <View style={styles.modalButtonsRow}>
                {confirmDialog.buttons.map((btn, index) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.modalButton,
                        isDestructive && styles.modalButtonDestructive,
                        isCancel && styles.modalButtonCancel,
                      ]}
                      onPress={() => {
                        setConfirmDialog(null);
                        btn.onPress?.();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.modalButtonText,
                          isDestructive && styles.modalButtonTextDestructive,
                          isCancel && styles.modalButtonTextCancel,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignSelf: 'center',
    maxWidth: 560,
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: theme.Colors.onSurface,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
    }),
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 0,
    gap: 12,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  accentStripe: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    marginRight: theme.Spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  toastMessage: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    lineHeight: 18,
  },
  toastBlurWeb: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.4)',
  },
  modalCard: {
    width: 320,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: theme.Spacing.lg,
    alignItems: 'center',
    shadowColor: theme.Colors.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  modalTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: theme.Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.Spacing.lg,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.primary,
  },
  modalButtonDestructive: {
    backgroundColor: theme.Colors.error,
  },
  modalButtonCancel: {
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  modalButtonText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onPrimary,
  },
  modalButtonTextDestructive: {
    color: theme.Colors.onPrimary,
  },
  modalButtonTextCancel: {
    color: theme.Colors.onSurfaceVariant,
  },
});
