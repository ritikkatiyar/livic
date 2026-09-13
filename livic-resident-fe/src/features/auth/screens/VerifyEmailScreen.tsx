import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { resendVerification, verifyEmail } from '@/src/features/auth/api/auth.api';
import { useAppTheme, type AppTheme } from '@/src/theme/ThemeContext';
import type { TokenBundle } from '@/src/types/auth';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyEmailScreenProps {
  email: string;
  codeAlreadySent: boolean;
  onVerified: (data: TokenBundle) => void | Promise<void>;
  onChangeEmail: () => void;
}

export default function VerifyEmailScreen({ email, codeAlreadySent, onVerified, onChangeEmail }: VerifyEmailScreenProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(codeAlreadySent ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verifyMutation = useMutation({
    mutationFn: (value: string) => verifyEmail({ email, code: value }),
    onSuccess: async (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onVerified(data);
    },
    onError: (error: Error) => {
      setCode('');
      setErrorMsg(error.message || 'Could not verify the code. Please try again.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerification({ email }),
    onSuccess: () => {
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setInfoMsg('A new code is on its way.');
    },
    onError: (error: Error) => setErrorMsg(error.message || 'Could not send a new code.'),
  });

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setErrorMsg('');
    setInfoMsg('');
    if (digits.length === CODE_LENGTH && !verifyMutation.isPending) {
      verifyMutation.mutate(digits);
    }
  };

  const handleResend = () => {
    setErrorMsg('');
    resendMutation.mutate();
  };

  return (
    <PageShell scrollable keyboardAvoiding contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name="mark-email-read" size={28} color={theme.Colors.primary} />
        </View>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          {codeAlreadySent ? 'Enter the 6-digit code we sent to' : 'Request a code to verify'}
        </Text>
        <Text style={styles.email}>{email}</Text>

        {errorMsg ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color={theme.Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}
        {infoMsg ? <Text style={styles.infoText}>{infoMsg}</Text> : null}

        <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()} accessibilityLabel="Verification code">
          {Array.from({ length: CODE_LENGTH }).map((_, index) => {
            const isActive = focused && index === Math.min(code.length, CODE_LENGTH - 1);
            return (
              <View key={index} style={[styles.codeBox, isActive && styles.codeBoxActive]}>
                <Text style={styles.codeDigit}>{code[index] ?? ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            testID="verification-code-input"
            value={code}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={CODE_LENGTH}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus
            style={styles.hiddenInput}
          />
        </Pressable>

        <ActionButton
          title="VERIFY"
          onPress={() => verifyMutation.mutate(code)}
          loading={verifyMutation.isPending}
          disabled={code.length !== CODE_LENGTH}
          fullWidth
          size="lg"
        />

        <View style={styles.footer}>
          <ActionButton
            title={secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
            variant="ghost"
            size="sm"
            onPress={handleResend}
            loading={resendMutation.isPending}
            disabled={secondsLeft > 0}
          />
          <ActionButton title="Use a different email" variant="ghost" size="sm" onPress={onChangeEmail} />
        </View>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.containerPadding,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: theme.Rounded.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    paddingHorizontal: theme.Spacing.stackLg,
    paddingVertical: theme.Spacing.stackLg,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: theme.Rounded.full,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.stackMd,
  },
  title: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.Spacing.stackSm,
  },
  email: {
    ...theme.Typography.labelLarge,
    color: theme.Colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.Spacing.stackLg,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.Spacing.stackSm,
    marginBottom: theme.Spacing.stackLg,
    position: 'relative',
  },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: theme.Rounded.md,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxActive: {
    borderColor: theme.Colors.primary,
    borderWidth: 2,
  },
  codeDigit: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onSurface,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.stackSm,
    backgroundColor: theme.Colors.errorContainer,
    padding: theme.Spacing.stackSm,
    borderRadius: theme.Rounded.default,
    marginBottom: theme.Spacing.stackMd,
    width: '100%',
  },
  errorText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.error,
    flex: 1,
  },
  infoText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.primary,
    marginBottom: theme.Spacing.stackMd,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: theme.Spacing.stackMd,
    gap: theme.Spacing.stackSm,
  },
});
