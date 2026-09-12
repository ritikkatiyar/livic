import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { saveUserPreference, SaveUserPreferenceRequest } from '@/src/features/user/api/userPreference.api';
import { validateAndApplyJoinCode } from '@/src/features/properties/api/rolePermission.api';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { setLocalOnboardingStatus } from '@/src/components/common/layout/OnboardingGate';

const MODULES = [
  {
    id: 'RENTAL',
    title: 'Rental Block',
    description: 'Manage apartments, flats, tenants, and rental leases.',
    icon: '🏢'
  },
  {
    id: 'RESIDENTIAL',
    title: 'Residential Block',
    description: 'Manage residential properties, owners, and community maintenance.',
    icon: '🏠'
  }
] as const;

export default function OnboardingScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const [selectedModule, setSelectedModule] = useState<SaveUserPreferenceRequest['activeMode'] | null>(null);
  const [loading, setLoading] = useState(false);

  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const router = useRouter();
  const { accessToken, setContext } = useAuth();

  const handleComplete = async () => {
    if (!selectedModule) return;
    setLoading(true);
    try {
      await saveUserPreference({
        activeMode: selectedModule,
        onboardingDone: true
      }, accessToken!);
      setLocalOnboardingStatus(accessToken, true);
      router.replace('/command-center' as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save setup preference');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter a valid invite code');
      return;
    }
    setJoining(true);
    try {
      const res = await validateAndApplyJoinCode(accessToken!, inviteCode.trim());

      try {
        await saveUserPreference({
          activeMode: 'RENTAL',
          onboardingDone: true
        }, accessToken!);
      } catch {
        // Backend marks onboarding done upon code application
      }
      setLocalOnboardingStatus(accessToken, true);
      setContext(null);

      Alert.alert(
        'Welcome!',
        `Successfully joined ${res.propertyName || 'the property'} as ${res.title || 'Member'}!`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (res.title?.toLowerCase() === 'resident' || res.title?.toLowerCase() === 'tenant') {
                router.replace('/tenant-home' as any);
              } else {
                router.replace('/command-center' as any);
              }
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Join Failed', e.message || 'Invalid or expired invite code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <PageShell scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Livic</Text>
        <Text style={styles.subtitle}>How do you plan to use Livic today?</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !isInviteMode && styles.activeTab]}
          onPress={() => setIsInviteMode(false)}
        >
          <Text style={[styles.tabText, !isInviteMode && styles.activeTabText]}>Setup Workspace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isInviteMode && styles.activeTab]}
          onPress={() => setIsInviteMode(true)}
        >
          <Text style={[styles.tabText, isInviteMode && styles.activeTabText]}>Have an Invite Code?</Text>
        </TouchableOpacity>
      </View>

      {!isInviteMode ? (
        <>
          <View style={styles.grid}>
            {MODULES.map((m) => {
              const isSelected = selectedModule === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.card, isSelected && styles.selectedCard]}
                  onPress={() => setSelectedModule(m.id as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.icon}>{m.icon}</Text>
                  <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{m.title}</Text>
                  <Text style={styles.cardDesc}>{m.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <ActionButton
              label="Get Started"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!selectedModule || loading}
              onPress={handleComplete}
            />
          </View>
        </>
      ) : (
        <View style={styles.inviteContainer}>
          <Text style={styles.inviteLabel}>Enter your invite code</Text>
          <TextInput
            style={styles.inviteInput}
            placeholder="e.g. AB12CD"
            placeholderTextColor={theme.Colors.onSurfaceVariant}
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            maxLength={10}
            autoCapitalize="characters"
          />
          <Text style={styles.inviteHint}>
            Ask your property owner or landlord for an invitation code to join their workspace directly.
          </Text>

          <View style={{ marginTop: 24 }}>
            <ActionButton
              label="Join Workspace"
              variant="primary"
              size="lg"
              fullWidth
              loading={joining}
              disabled={!inviteCode.trim() || joining}
              onPress={handleJoinByCode}
            />
          </View>
        </View>
      )}
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  content: {
    padding: theme.Spacing.containerPadding,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: theme.Typography.headlineMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: theme.Rounded.md,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.Rounded.sm,
  },
  activeTab: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: theme.Colors.outline,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  activeTabText: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  grid: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    padding: 20,
    borderRadius: theme.Rounded.lg,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
  },
  selectedCard: {
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  icon: {
    fontSize: theme.Typography.headlineLarge.fontSize,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: 4,
  },
  selectedText: {
    color: theme.Colors.primary,
  },
  cardDesc: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  inviteContainer: {
    padding: 20,
    borderRadius: theme.Rounded.lg,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
  },
  inviteLabel: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  inviteInput: {
    fontSize: theme.Typography.headlineSmall.fontSize,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    padding: 16,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerLow,
    color: theme.Colors.onSurface,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
  },
  inviteHint: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
