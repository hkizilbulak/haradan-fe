import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { AuthCheckbox } from './AuthCheckbox';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { isHttpAuthEnabled } from '@/services/http';

type LoginFormProps = {
  onSuccess?: () => void;
};

function safeNextPath(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/auth')) return null;
  return value;
}

function firstParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{
    next?: string | string[];
    registered?: string | string[];
    verified?: string | string[];
  }>();
  const { login, resendVerification, loading, error, errorCode, clearError } =
    useAuth();
  const { tokens } = useAuthTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState<string | null>(() => {
    if (firstParam(params.verified) === '1') {
      return 'E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.';
    }
    if (firstParam(params.registered) === '1') {
      return 'Kayıt başarılı. Giriş yapabilirsiniz.';
    }
    return null;
  });
  const [resendNote, setResendNote] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearError();
    setResendNote(null);
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

  const handleResend = async () => {
    const result = await resendVerification(email.trim());
    if (result) setResendNote(result.message);
  };

  const needsVerify = errorCode === 'EMAIL_NOT_VERIFIED';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.text }]}>Giriş yap</Text>

      <Text style={[styles.sub, { color: tokens.textSecondary }]}>
        Hesabınız yok mu?{' '}
        <Link href="/auth/signup" style={[styles.link, { color: tokens.text }]}>
          Hesap oluştur
        </Link>
      </Text>

      {info ? (
        <Text style={[styles.info, { color: tokens.text }]}>{info}</Text>
      ) : null}

      <View style={styles.fields}>
        <AuthTextField
          label="E-posta"
          placeholder="E-posta"
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
          label="Parola"
          placeholder="Parola"
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
          label="Beni hatırla"
          checked={remember}
          onChange={setRemember}
        />
        <Link
          href="/auth/forgot-password"
          style={[styles.forgot, { color: tokens.text }]}
        >
          Parolamı unuttum
        </Link>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: tokens.error }]}>{error}</Text>
      ) : null}
      {resendNote ? (
        <Text style={[styles.info, { color: tokens.text }]}>{resendNote}</Text>
      ) : null}

      {needsVerify ? (
        <AuthSubmitButton
          label="Doğrulama e-postasını gönder"
          onPress={handleResend}
          loading={loading}
          disabled={!email.trim()}
        />
      ) : null}

      <AuthSubmitButton
        label="Giriş yap"
        onPress={handleSubmit}
        loading={loading}
        disabled={!email.trim() || !password}
      />

      {__DEV__ && !isHttpAuthEnabled() ? (
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
  info: {
    ...Typography.small,
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
  demoHint: {
    alignSelf: 'flex-start',
  },
  demoText: {
    ...Typography.caption,
  },
});
