import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { saveUserPreference } from '@/src/features/user/api/userPreference.api';
import { validateAndApplyJoinCode } from '@/src/features/properties/api/rolePermission.api';
import { MaterialIcons } from '@expo/vector-icons';

export default function ResidentOnboardingScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [loading, setLoading] = useState(false);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  
  const router = useRouter();
  const { accessToken, setContext } = useAuth();

  const handleCompleteResidentOnboarding = async () => {
    setLoading(true);
    try {
      await saveUserPreference({
        activeMode: 'RENTAL',
        onboardingDone: true,
      }, accessToken);
      router.replace('/tenant-home');
    } catch (error) {
      console.error('Failed to save resident preference', error);
      router.replace('/tenant-home');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProperty = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Validation', 'Please enter a valid invite or unit code.');
      return;
    }
    setJoining(true);
    try {
      const res = await validateAndApplyJoinCode(accessToken!, inviteCode.trim());
      
      await saveUserPreference({
        activeMode: 'RENTAL',
        onboardingDone: true,
      }, accessToken);

      setContext(null);

      Alert.alert('Welcome!', `Successfully joined "${res.propertyName}"!`, [
        { text: 'Go to My Dashboard', onPress: () => router.replace('/tenant-home') }
      ]);
    } catch (error: any) {
      Alert.alert('Join Failed', error.message || 'The invite code is invalid or expired.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <MaterialIcons name="home-work" size={20} color={theme.Colors.primary} />
            <Text style={styles.badgeText}>Resident Portal</Text>
          </View>
          <Text style={styles.title}>Welcome to Livic</Text>
          <Text style={styles.subtitle}>
            {isInviteMode
              ? 'Enter the invite code provided by your landlord or property manager.'
              : 'Your all-in-one portal for rent payments, maintenance requests, and lease documents.'}
          </Text>
        </View>

        {isInviteMode ? (
          <View style={styles.formSection}>
            <TextInput
              style={styles.inviteInput}
              placeholder="e.g. RES-9821-UNIT"
              placeholderTextColor="#94a3b8"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.primaryButton, (!inviteCode.trim() || joining) && styles.buttonDisabled]}
              onPress={handleJoinProperty}
              disabled={!inviteCode.trim() || joining}
              activeOpacity={0.8}
            >
              {joining ? (
                <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <Text style={styles.primaryButtonText}>Join Unit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsInviteMode(false)}>
              <Text style={styles.secondaryButtonText}>Back to Welcome</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCompleteResidentOnboarding}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryButtonText}>Go to Resident Dashboard</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={theme.Colors.surfaceContainerLowest} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsInviteMode(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="vpn-key" size={18} color={theme.Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Have an invite code? Join your unit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: theme.Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: theme.Colors.onSurface,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.Colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: theme.Typography.headlineMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    width: '100%',
    alignItems: 'center',
  },
  actionsSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  inviteInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 14,
    padding: 16,
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    backgroundColor: theme.Colors.surfaceContainerLow,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: theme.Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.Colors.outlineVariant,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
});
