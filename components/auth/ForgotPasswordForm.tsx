import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';

export function ForgotPasswordForm() {
  const { forgotPassword, loading, error, clearError } = useAuth();
  const { tokens } = useAuthTheme();
  const [email, setEmail] = useState('');
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearError();
    setDoneMessage(null);
    const result = await forgotPassword(email.trim());
    if (!result) return;
    setDoneMessage(result.message);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.text }]}>Parolamı unuttum</Text>
      <Text style={[styles.sub, { color: tokens.textSecondary }]}>
        E-posta adresinizi girin; hesap varsa sıfırlama talimatı gönderilir.{' '}
        <Link href="/auth/login" style={[styles.link, { color: tokens.text }]}>
          Girişe dön
        </Link>
      </Text>

      <AuthTextField
        label="E-posta"
        placeholder="E-posta"
        value={email}
        onChangeText={(v) => {
          clearError();
          setDoneMessage(null);
          setEmail(v);
        }}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {error ? (
        <Text style={[styles.banner, { color: tokens.error }]}>{error}</Text>
      ) : null}
      {doneMessage ? (
        <Text style={[styles.banner, { color: tokens.text }]}>{doneMessage}</Text>
      ) : null}

      <AuthSubmitButton
        label="Sıfırlama bağlantısı gönder"
        onPress={handleSubmit}
        loading={loading}
        disabled={!email.trim()}
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
