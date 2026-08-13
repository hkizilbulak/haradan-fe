import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { AuthCheckbox } from './AuthCheckbox';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { SocialAuthButtons } from './SocialAuthButtons';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';

type LoginFormProps = {
  onSuccess?: () => void;
};

function safeNextPath(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/auth')) return null;
  return value;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const { login, loading, error, clearError } = useAuth();
  const { tokens } = useAuthTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    clearError();
    const session = await login(email.trim(), password);
    if (!session) return;
    if (remember && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('haradan.rememberEmail', email.trim());
      } catch {
        /* ignore */
      }
    }
    onSuccess?.();
    const next = safeNextPath(params.next);
    if (next) router.replace(next as Href);
    else router.replace('/');
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.text }]}>Welcome back</Text>

      <Text style={[styles.sub, { color: tokens.textSecondary }]}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" style={[styles.link, { color: tokens.text }]}>
          Create an account
        </Link>
      </Text>

      <View style={styles.fields}>
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
          returnKeyType="next"
        />
        <AuthTextField
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={(v) => {
            clearError();
            setPassword(v);
          }}
          secureTextEntry={!showPassword}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword((s) => !s)}
        />
      </View>

      <View style={styles.utility}>
        <AuthCheckbox
          label="Remember for 30 days"
          checked={remember}
          onChange={setRemember}
        />
        <Link
          href="/auth/forgot-password"
          style={[styles.forgot, { color: tokens.text }]}
        >
          Forgot password?
        </Link>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
      ) : null}

      <AuthSubmitButton
        label="Sign In"
        onPress={handleSubmit}
        loading={loading}
        disabled={!email.trim() || !password}
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
          if (__DEV__) console.log('[auth] social', provider);
        }}
      />

      {__DEV__ ? (
        <Pressable
          onPress={() => {
            setEmail('demo@cartzilla.com');
            setPassword('password123');
          }}
          style={styles.demoHint}
        >
          <Text style={[styles.demoText, { color: tokens.textMuted }]}>
            Demo: demo@cartzilla.com / password123
          </Text>
        </Pressable>
      ) : null}
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
  utility: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  forgot: {
    ...Typography.small,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  demoHint: {
    alignSelf: 'flex-start',
  },
  demoText: {
    ...Typography.caption,
  },
});
