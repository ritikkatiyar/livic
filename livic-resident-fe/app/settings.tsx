import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import {
  getResidentNotificationPreferences,
  updateResidentNotificationPreferences,
} from '@/src/features/user/api/residentNotificationPreference.api';

export default function ResidentSettingsScreen() {
  const { theme, isDark, mode, setMode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingChannel, setSavingChannel] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingPrefs(true);
    getResidentNotificationPreferences(accessToken)
      .then((res) => {
        setEmailEnabled(res.emailEnabled ?? true);
        setPushEnabled(res.pushEnabled ?? true);
        setWhatsappEnabled(res.whatsappEnabled ?? true);
      })
      .catch((e) => console.warn('Failed to load resident notification preferences', e))
      .finally(() => setLoadingPrefs(false));
  }, [accessToken]);

  const handleToggle = async (channel: 'email' | 'push' | 'whatsapp', newValue: boolean) => {
    if (!accessToken) return;

    const nextEmail = channel === 'email' ? newValue : emailEnabled;
    const nextPush = channel === 'push' ? newValue : pushEnabled;
    const nextWhatsapp = channel === 'whatsapp' ? newValue : whatsappEnabled;

    if (channel === 'email') setEmailEnabled(newValue);
    if (channel === 'push') setPushEnabled(newValue);
    if (channel === 'whatsapp') setWhatsappEnabled(newValue);

    setSavingChannel(channel);
    try {
      await updateResidentNotificationPreferences(accessToken, {
        emailEnabled: nextEmail,
        pushEnabled: nextPush,
        whatsappEnabled: nextWhatsapp,
      });
    } catch (e) {
      console.warn('Failed to save resident notification preference', e);
      // Revert on error
      if (channel === 'email') setEmailEnabled(!newValue);
      if (channel === 'push') setPushEnabled(!newValue);
      if (channel === 'whatsapp') setWhatsappEnabled(!newValue);
    } finally {
      setSavingChannel(null);
    }
  };

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: theme.Colors.onBackground }]}>Settings & Preferences</Text>
        <Text style={[styles.heroSubtitle, { color: theme.Colors.onSurfaceVariant }]}>
          Manage your account theme, notification channels, and app preferences
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Appearance & Theme Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="palette" size={22} color={theme.Colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.Colors.onBackground }]}>Appearance & Theme</Text>
          </View>
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>App Theme Mode</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Choose between Light, Dark, or System preference
              </Text>
            </View>
          </View>
          <View style={styles.themeOptionsRow}>
            {(['system', 'light', 'dark'] as const).map((themeOption) => {
              const isSelected = mode === themeOption;
              return (
                <TouchableOpacity
                  key={themeOption}
                  style={[
                    styles.themeOptionBtn,
                    {
                      borderColor: isSelected ? theme.Colors.primary : theme.Surface.border,
                      backgroundColor: isSelected ? theme.Colors.primaryContainer : theme.Surface.cardMuted,
                    },
                  ]}
                  onPress={() => setMode(themeOption)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={
                      themeOption === 'system'
                        ? 'settings-brightness'
                        : themeOption === 'dark'
                        ? 'dark-mode'
                        : 'light-mode'
                    }
                    size={18}
                    color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant },
                    ]}
                  >
                    {themeOption}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Notification Channel Preferences Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="notifications-active" size={22} color={theme.Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.Colors.onBackground }]}>Notification Preferences</Text>
              <Text style={[styles.cardSub, { color: theme.Colors.onSurfaceVariant }]}>
                Choose how you want to receive rent statements, notices, and updates
              </Text>
            </View>
            {loadingPrefs && <ActivityIndicator size="small" color={theme.Colors.primary} />}
          </View>

          {/* Mobile Push Toggle */}
          <View style={styles.prefRow}>
            <View style={styles.prefIconCircle}>
              <MaterialIcons name="phone-android" size={20} color={theme.Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>Mobile Push Notifications</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Receive real-time push alerts on your phone for new invoices and maintenance
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(val) => handleToggle('push', val)}
              thumbColor={pushEnabled ? theme.Colors.primary : theme.Colors.outline}
              trackColor={{ false: theme.Colors.outlineVariant, true: theme.Colors.primaryContainer }}
            />
          </View>

          {/* Email Notifications Toggle */}
          <View style={styles.prefRow}>
            <View style={styles.prefIconCircle}>
              <MaterialIcons name="email" size={20} color={theme.Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>Email Statements</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Receive monthly itemized rent statements and receipts in your email inbox
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={(val) => handleToggle('email', val)}
              thumbColor={emailEnabled ? theme.Colors.primary : theme.Colors.outline}
              trackColor={{ false: theme.Colors.outlineVariant, true: theme.Colors.primaryContainer }}
            />
          </View>

          {/* WhatsApp / SMS Toggle */}
          <View style={[styles.prefRow, styles.prefRowLast]}>
            <View style={styles.prefIconCircle}>
              <MaterialIcons name="chat" size={20} color={theme.Colors.tertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>WhatsApp & SMS Alerts</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Get quick due date reminders and payment confirmations directly on WhatsApp
              </Text>
            </View>
            <Switch
              value={whatsappEnabled}
              onValueChange={(val) => handleToggle('whatsapp', val)}
              thumbColor={whatsappEnabled ? theme.Colors.primary : theme.Colors.outline}
              trackColor={{ false: theme.Colors.outlineVariant, true: theme.Colors.primaryContainer }}
            />
          </View>
        </GlassCard>

        {/* About & Support Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={22} color={theme.Colors.secondary} />
            <Text style={[styles.cardTitle, { color: theme.Colors.onBackground }]}>About & Support</Text>
          </View>
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>Livic Resident Portal</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Version 1.2.0 • Modern Minimal & Glass Edition
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  containerDesktop: {
    paddingTop: 32,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroTitle: {
    ...theme.Typography.headlineMd,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: theme.Typography.bodySmall.fontSize,
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: theme.Typography.bodySmall.fontSize,
    marginTop: 2,
    lineHeight: 16,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  prefRowLast: {
    borderBottomWidth: 0,
  },
  prefIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerHigh || theme.Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeOptionBtn: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  themeOptionText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
