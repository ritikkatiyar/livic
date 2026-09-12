import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { login } from '@/src/features/auth/api/auth.api';

interface SuperAdminLoginScreenProps {
  onLogin?: (data: any) => void;
  onNavigateToSignup?: () => void;
}

export default function SuperAdminLoginScreen({ onLogin, onNavigateToSignup }: SuperAdminLoginScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const data = await login({ email, password });
      
      // Success! Pass token bundle back to index.tsx (or context)
      if (onLogin) {
        onLogin(data);
      }
    } catch (error: any) {
      console.error('Login Request Error:', error);
      setErrorMsg(error.message || 'Cannot connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      scrollable={true}
      keyboardAvoiding={true}
      contentContainerStyle={styles.scrollContent}
    >
          {/* Main Content Area */}
          <View style={styles.cardContainer}>
            {/* Branding */}
            <View style={styles.brandingContainer}>
              <View style={styles.iconWrapper}>
                <MaterialIcons name="home" size={28} color={theme.Colors.primary} />
              </View>
              <Text style={styles.brandingText}>RESIDENT PORTAL</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome Back</Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={theme.Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Resident Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="resident@livic.app"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {email ? (
                    <TouchableOpacity 
                      style={styles.clearIcon}
                      onPress={() => setEmail('')}
                    >
                      <MaterialIcons name="cancel" size={20} color={theme.Colors.outlineVariant} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggleIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={theme.Colors.outlineVariant} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                testID="login-button"
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                activeOpacity={0.8} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.Colors.onPrimaryContainer} />
                ) : (
                  <Text style={styles.submitButtonText}>SIGN IN</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don{"'"}t have an account?</Text>
              <TouchableOpacity onPress={onNavigateToSignup}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.containerPadding,
    position: 'relative',
  },
  orb: {
    position: 'absolute',
    borderRadius: theme.Rounded.full,
    opacity: 0.3,
  },
  orb1: {
    top: '10%',
    left: '5%',
    width: 300,
    height: 300,
    backgroundColor: theme.Colors.primaryFixed,
    filter: 'blur(100px)' as any,
  },
  orb2: {
    bottom: '15%',
    right: '-10%',
    width: 350,
    height: 350,
    backgroundColor: theme.Colors.secondaryFixed,
    filter: 'blur(120px)' as any,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: theme.Rounded.lg,
    paddingHorizontal: theme.Spacing.stackLg,
    paddingTop: theme.Spacing.xxl,
    paddingBottom: theme.Spacing.stackLg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: theme.Spacing.stackMd,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.stackSm,
  },
  brandingText: {
    ...theme.Typography.labelCaps,
    color: theme.Colors.outline,
    marginTop: theme.Spacing.sm,
  },
  title: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onSurface,
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: theme.Spacing.lg,
  },
  label: {
    ...theme.Typography.labelCaps,
    color: theme.Colors.onSurfaceVariant,
    marginLeft: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: theme.Spacing.stackMd,
    zIndex: 1,
  },
  passwordToggleIcon: {
    position: 'absolute',
    right: theme.Spacing.stackMd,
    zIndex: 1,
    padding: theme.Spacing.xs,
  },
  clearIcon: {
    position: 'absolute',
    right: theme.Spacing.stackMd,
    zIndex: 1,
    padding: theme.Spacing.xs,
  },
  input: {
    width: '100%',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: theme.Rounded.default,
    paddingLeft: 44,
    paddingRight: theme.Spacing.stackMd,
    paddingVertical: 14,
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurface,
  },
  submitButton: {
    marginTop: theme.Spacing.sm,
    width: '100%',
    minHeight: 48,
    backgroundColor: theme.Colors.primaryContainer,
    paddingVertical: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.stackMd,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.Colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...theme.Typography.labelCaps,
    color: theme.Colors.onPrimaryContainer,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.errorContainer,
    padding: 12,
    borderRadius: theme.Rounded.default,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.error,
    marginLeft: theme.Spacing.sm,
    fontSize: theme.Typography.bodySmall.fontSize,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.Spacing.xl,
    gap: theme.Spacing.sm,
  },
  footerText: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurfaceVariant,
  },
  footerLink: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.surfaceTint,
    fontWeight: '600',
  },
});
