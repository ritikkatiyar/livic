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
import { Theme } from '@/src/theme/Theme';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { signup } from '@/src/features/auth/api/auth.api';

const ValidationIndicator = ({ label, isValid, theme, styles }: { label: string; isValid: boolean; theme: any; styles: any }) => (
  <View style={styles.requirementRow}>
    <MaterialIcons 
      name={isValid ? "check-circle" : "radio-button-unchecked"} 
      size={14} 
      color={isValid ? theme.Colors.primary : theme.Colors.outlineVariant} 
    />
    <Text style={[styles.requirementText, isValid && styles.requirementTextValid]}>
      {label}
    </Text>
  </View>
);

interface SuperAdminSignupScreenProps {
  onSignup?: (data: any) => void;
  onNavigateToLogin?: () => void;
}

export default function SuperAdminSignupScreen({
  onSignup,
  onNavigateToLogin,
}: SuperAdminSignupScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Field Touched states for inline visual validation
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Field references for auto-advance keyboard flow
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Dynamic Password Policy Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isFormValid = fullName.trim().length > 0 && email.includes('@') && hasMinLength;

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      setErrorMsg('Please complete all mandatory credential fields.');
      return;
    }

    if (!hasMinLength) {
      setErrorMsg('Security Policy: Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await signup({
        fullName,
        email,
        phoneNumber,
        password,
      });

      if (onSignup) {
        onSignup(data);
      }
    } catch (err: any) {
      console.error('[SuperAdminSignupScreen] Signup error:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setErrorMsg(message);
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
                <MaterialIcons name="person-add" size={28} color={theme.Colors.primary} />
              </View>
              <Text style={styles.brandingText}>CREATE ACCOUNT</Text>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={theme.Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Signup Form */}
            <View style={styles.formContainer}>
              
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={fullName}
                    onChangeText={setFullName}
                    onBlur={() => setFullNameTouched(true)}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {fullNameTouched && (
                    fullName.trim().length > 0 ? (
                      <MaterialIcons name="check" size={20} color={theme.Colors.primary} style={styles.validationIcon} />
                    ) : (
                      <MaterialIcons name="close" size={20} color={theme.Colors.error} style={styles.validationIcon} />
                    )
                  )}
                </View>
              </View>

              {/* Email Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    ref={emailInputRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="user@example.com"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => setEmailTouched(true)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {emailTouched && (
                    email.includes('@') && email.includes('.') ? (
                      <MaterialIcons name="check" size={20} color={theme.Colors.primary} style={styles.validationIcon} />
                    ) : (
                      <MaterialIcons name="close" size={20} color={theme.Colors.error} style={styles.validationIcon} />
                    )
                  )}
                </View>
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="phone" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    ref={phoneInputRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="+1 555-0199"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onBlur={() => setPhoneTouched(true)}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {phoneNumber ? (
                    <TouchableOpacity 
                      style={styles.clearIcon}
                      onPress={() => setPhoneNumber('')}
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
                    onSubmitEditing={handleSignup}
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

                {/* Real-time Password Strength Requirements */}
                {password.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <ValidationIndicator label="At least 8 characters" isValid={password.length >= 8} theme={theme} styles={styles} />
                    <ValidationIndicator label="Uppercase & Lowercase letters" isValid={/[a-z]/.test(password) && /[A-Z]/.test(password)} theme={theme} styles={styles} />
                    <ValidationIndicator label="At least one number" isValid={/\d/.test(password)} theme={theme} styles={styles} />
                    <ValidationIndicator label="At least one special character" isValid={/[@$!%*?&#.\-_^+=~()[\]{}|\\:;"'<>,/]/.test(password)} theme={theme} styles={styles} />
                  </View>
                )}
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                activeOpacity={0.8} 
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.Colors.onPrimaryContainer} />
                ) : (
                  <Text style={styles.submitButtonText}>SIGN UP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.footerLink}>Sign In</Text>
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
    paddingVertical: 40,
  },
  orb: {
    position: 'absolute',
    borderRadius: theme.Rounded.full,
    opacity: 0.3,
  },
  orb1: {
    top: '5%',
    left: '0%',
    width: 250,
    height: 250,
    backgroundColor: theme.Colors.primaryFixed,
    filter: 'blur(80px)' as any,
  },
  orb2: {
    bottom: '5%',
    right: '-5%',
    width: 300,
    height: 300,
    backgroundColor: theme.Colors.secondaryFixed,
    filter: 'blur(100px)' as any,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: theme.Rounded.lg,
    paddingHorizontal: theme.Spacing.stackLg,
    paddingTop: 40,
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
    marginBottom: theme.Spacing.stackLg,
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
    ...theme.Typography.headlineMd,
    color: theme.Colors.onSurface,
    marginTop: theme.Spacing.sm,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
  requirementsContainer: {
    marginTop: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: theme.Rounded.default,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    width: '100%',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.bodySmall.fontSize,
    marginLeft: theme.Spacing.sm,
  },
  requirementTextValid: {
    color: theme.Colors.primary,
    fontWeight: '500',
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
  validationIcon: {
    position: 'absolute',
    right: 14,
  },
});
