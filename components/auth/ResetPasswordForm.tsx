import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { PasswordStrengthBar } from './PasswordStrengthBar';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';

type ResetPasswordFormProps = {
  token?: string;
  onSuccess?: (message: string) => void;
};

export function ResetPasswordForm({
  token: initialToken = '',
  onSuccess,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const { resetPassword, loading, error, clearError } = useAuth();
  const { tokens } = useAuthTheme();

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearError();
    setFieldError(null);

    const cleanToken = token.trim();
    if (!cleanToken) {
      setFieldError('Sıfırlama bağlantısı veya jetonu eksik.');
      return;
    }

    if (newPassword.length < 8) {
      setFieldError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldError('Şifreler eşleşmiyor.');
      return;
    }

    const result = await resetPassword(cleanToken, newPassword);
    if (!result) return;

    setDoneMessage(result.message || 'Şifreniz başarıyla güncellendi.');
    if (onSuccess) {
      onSuccess(result.message);
    }
  };

  if (doneMessage) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: tokens.text }]}>Şifreniz Güncellendi</Text>
        <Text style={[styles.sub, { color: tokens.textSecondary }]}>
          {doneMessage}
        </Text>
        <AuthSubmitButton
          label="Giriş Yap"
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.text }]}>Yeni Şifre Belirle</Text>
      <Text style={[styles.sub, { color: tokens.textSecondary }]}>
        Lütfen hesabınız için yeni ve güvenli bir şifre girin.
      </Text>

      {!initialToken ? (
        <AuthTextField
          label="Sıfırlama Kodu / Jeton"
          placeholder="E-postanıza gelen kodu girin"
          value={token}
          onChangeText={(v) => {
            clearError();
            setFieldError(null);
            setToken(v);
          }}
          autoCapitalize="none"
          autoComplete="off"
        />
      ) : null}

      <AuthTextField
        label="Yeni Şifre"
        placeholder="En az 8 karakter"
        value={newPassword}
        onChangeText={(v) => {
          clearError();
          setFieldError(null);
          setNewPassword(v);
        }}
        secureTextEntry={!showPassword}
        showPasswordToggle
        isPasswordVisible={showPassword}
        onTogglePasswordVisibility={() => setShowPassword((p) => !p)}
        autoCapitalize="none"
        autoComplete="new-password"
      />

      <PasswordStrengthBar password={newPassword} />

      <AuthTextField
        label="Yeni Şifre (Tekrar)"
        placeholder="Şifrenizi tekrar girin"
        value={confirmPassword}
        onChangeText={(v) => {
          clearError();
          setFieldError(null);
          setConfirmPassword(v);
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {fieldError ? (
        <Text style={[styles.banner, { color: tokens.error }]}>{fieldError}</Text>
      ) : null}

      {error ? (
        <Text style={[styles.banner, { color: tokens.error }]}>{error}</Text>
      ) : null}

      <AuthSubmitButton
        label="Şifreyi Güncelle"
        onPress={handleSubmit}
        loading={loading}
        disabled={!newPassword || !confirmPassword || (!initialToken && !token.trim())}
      />

      <Link href="/auth/login" style={[styles.link, { color: tokens.text }]}>
        Girişe dön
      </Link>
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
  banner: {
    ...Typography.small,
  },
});
