import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { SocialAuthButtons } from './SocialAuthButtons';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';

type SignupFormProps = {
  onSuccess?: (message: string) => void;
};

export function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuth();
  const { tokens } = useAuthTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearError();
    setFieldError(null);
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return;
    }
    const result = await register({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    if (!result) return;
    onSuccess?.(result.message);
    router.replace({
      pathname: '/auth/login',
      params: { registered: '1' },
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.text }]}>Create account</Text>
      <Text style={[styles.sub, { color: tokens.textSecondary }]}>
        Already have an account?{' '}
        <Link href="/auth/login" style={[styles.link, { color: tokens.text }]}>
          Sign in
        </Link>
      </Text>

      <View style={styles.fields}>
        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <AuthTextField
              label="First name"
              placeholder="First name"
              value={firstName}
              onChangeText={(v) => {
                clearError();
                setFirstName(v);
              }}
              autoComplete="given-name"
              textContentType="givenName"
            />
          </View>
          <View style={styles.nameCol}>
            <AuthTextField
              label="Last name"
              placeholder="Last name"
              value={lastName}
              onChangeText={(v) => {
                clearError();
                setLastName(v);
              }}
              autoComplete="family-name"
              textContentType="familyName"
            />
          </View>
        </View>
        <AuthTextField
          label="Email"
          placeholder="Email"
          value={email}
          onChangeText={(v) => {
            clearError();
            setEmail(v);
          }}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <AuthTextField
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChangeText={(v) => {
            clearError();
            setFieldError(null);
            setPassword(v);
          }}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword((s) => !s)}
        />
        <AuthTextField
          label="Confirm password"
          placeholder="Confirm password"
          value={confirm}
          onChangeText={(v) => {
            setFieldError(null);
            setConfirm(v);
          }}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      {fieldError || error ? (
        <Text style={[styles.errorText, { color: tokens.error }]}>
          {fieldError ?? error}
        </Text>
      ) : null}

      <AuthSubmitButton
        label="Create account"
        onPress={handleSubmit}
        loading={loading}
        disabled={
          !firstName.trim() ||
          !lastName.trim() ||
          !email.trim() ||
          !password ||
          !confirm
        }
      />

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: tokens.divider }]} />
        <Text style={[styles.dividerText, { color: tokens.textMuted }]}>
          or continue with
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: tokens.divider }]} />
      </View>

      <SocialAuthButtons
        onPress={(provider) => {
          if (__DEV__) console.log('[auth] social signup', provider);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
    width: '100%',
    maxWidth: AUTH_FORM_MAX_WIDTH,
  },
  title: {
    ...Typography.h1,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sub: {
    ...Typography.body,
    marginTop: -Spacing.sm,
  },
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  fields: {
    gap: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameCol: {
    flex: 1,
  },
  errorText: {
    ...Typography.small,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.small,
  },
});
