import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { oauthLogin } from '@/src/features/auth/api/auth.api';
import { useAppTheme, type AppTheme } from '@/src/theme/ThemeContext';
import type { TokenBundle } from '@/src/types/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
};

const isGoogleSignInConfigured = Boolean(
  Platform.select({
    web: GOOGLE_CLIENT_IDS.webClientId,
    ios: GOOGLE_CLIENT_IDS.iosClientId,
    android: GOOGLE_CLIENT_IDS.androidClientId,
  })
);

interface GoogleSignInButtonProps {
  onSuccess: (data: TokenBundle) => void;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  // The Google hook throws when the current platform has no client ID, so only mount it when configured.
  if (!isGoogleSignInConfigured) {
    return null;
  }
  return <ConfiguredGoogleSignInButton onSuccess={onSuccess} />;
}

function ConfiguredGoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [errorMsg, setErrorMsg] = useState('');
  const [focused, setFocused] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_CLIENT_IDS);

  const loginMutation = useMutation({
    mutationFn: (idToken: string) => oauthLogin('google', { idToken }),
    onSuccess,
    onError: (error: Error) => setErrorMsg(error.message || 'Google sign-in failed. Please try again.'),
  });
  const { mutate } = loginMutation;

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }
    const idToken = response.params.id_token ?? response.authentication?.idToken;
    if (idToken) {
      mutate(idToken);
    } else {
      setErrorMsg('Google did not return an identity token.');
    }
  }, [response, mutate]);

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        disabled={!request || loginMutation.isPending}
        onPress={() => {
          setErrorMsg('');
          promptAsync();
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.iconButton,
          (pressed || focused) && styles.iconButtonActive,
          !request && styles.iconButtonDisabled,
        ]}
      >
        {loginMutation.isPending ? (
          <ActivityIndicator color={theme.Colors.primary} />
        ) : (
          <MaterialCommunityIcons name="google" size={24} color={theme.Colors.onSurface} />
        )}
      </Pressable>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: theme.Spacing.stackMd,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    borderColor: theme.Colors.primary,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.stackSm,
    marginBottom: theme.Spacing.stackMd,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.Colors.outlineVariant,
  },
  dividerText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.onSurfaceVariant,
  },
  errorText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.error,
    textAlign: 'center',
    marginTop: theme.Spacing.stackSm,
  },
});
