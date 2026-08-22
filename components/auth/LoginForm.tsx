import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { AuthBanner } from './AuthBanner';
import { AuthCheckbox } from './AuthCheckbox';
import { AuthFormHeader } from './AuthFormHeader';
import { useAuthLayout } from './AuthLayoutContext';
import { AuthScreenFooter } from './AuthScreenFooter';
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

function LoginFormBody({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{
    next?: string | string[];
    registered?: string | string[];
    verified?: string | string[];
  }>();
  const { login, resendVerification, loading, error, errorCode, clearError } =
    useAuth();
  const { tokens } = useAuthTheme();
  const { isGlass } = useAuthLayout();
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
    <View style={[styles.wrap, isGlass && styles.wrapGlass]}>
      <AuthFormHeader title="Giriş yap" />

      {info ? <AuthBanner message={info} variant="success" /> : null}
      {error && !needsVerify ? (
        <AuthBanner message={error} variant="error" />
      ) : null}
      {resendNote ? <AuthBanner message={resendNote} variant="info" /> : null}

      <View style={[styles.fields, isGlass && styles.fieldsGlass]}>
        <AuthTextField
          label="E-posta"
          placeholder="ornek@email.com"
          value={email}
          onChangeText={(v) => {
            clearError();
            setInfo(null);
            setEmail(v);
          }}
          leftIcon="mail-outline"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AuthTextField
          label="Parola"
          placeholder="••••••••"
          value={password}
          onChangeText={(v) => {
            clearError();
            setPassword(v);
          }}
          leftIcon="lock-closed-outline"
          secureTextEntry={!showPassword}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword((s) => !s)}
        />
      </View>

      <View style={[styles.utility, isGlass && styles.utilityGlass]}>
        <AuthCheckbox
          label="Beni hatırla"
          checked={remember}
          onChange={setRemember}
        />
        <Link
          href="/auth/forgot-password"
          style={[styles.forgot, { color: tokens.primary }]}
        >
          Parolamı unuttum
        </Link>
      </View>

      {needsVerify ? (
        <View style={styles.verifyBlock}>
          <AuthBanner
            message={error ?? 'E-posta adresinizi doğrulamanız gerekiyor.'}
            variant="error"
          />
          <AuthSubmitButton
            label="Doğrulama e-postasını tekrar gönder"
            onPress={handleResend}
            loading={loading}
            disabled={!email.trim()}
            variant="secondary"
          />
        </View>
      ) : null}

      <AuthSubmitButton
        label="Giriş yap"
        onPress={handleSubmit}
        loading={loading}
        disabled={!email.trim() || !password}
      />

      <AuthScreenFooter
        prompt="Hesabınız yok mu?"
        actionLabel="Hesap oluştur"
        href="/auth/signup"
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

export function LoginForm(props: LoginFormProps) {
  return <LoginFormBody {...props} />;
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
    width: '100%',
    maxWidth: AUTH_FORM_MAX_WIDTH,
  },
  wrapGlass: {
    gap: Spacing.md,
    maxWidth: undefined,
  },
  fields: {
    gap: Spacing.md,
  },
  fieldsGlass: {
    gap: Spacing.sm + 4,
  },
  utility: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginTop: -Spacing.xs,
  },
  utilityGlass: {
    marginTop: 0,
  },
  verifyBlock: {
    gap: Spacing.sm,
  },
  forgot: {
    ...Typography.small,
    fontWeight: '600',
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  demoHint: {
    alignSelf: 'center',
  },
  demoText: {
    ...Typography.caption,
  },
});
