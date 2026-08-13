import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthTextField } from './AuthTextField';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';

export function ForgotPasswordForm() {
  const router = useRouter();
  const { forgotPassword, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');
  const errorColor = useThemeColor('error');
  const success = useThemeColor('success');

  const handleSubmit = async () => {
    clearError();
    setDoneMessage(null);
    const result = await forgotPassword(email.trim());
    if (!result) return;
    setDoneMessage(result.message);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: text }]}>Forgot password?</Text>
      <Text style={[styles.sub, { color: textSecondary }]}>
        Enter your email and we&apos;ll send reset instructions.{' '}
        <Link href="/auth/login" style={[styles.link, { color: primary }]}>
          Back to sign in
        </Link>
      </Text>

      <AuthTextField
        label="Email"
        placeholder="Email"
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
        <Text style={[styles.banner, { color: errorColor }]}>{error}</Text>
      ) : null}
      {doneMessage ? (
        <Text style={[styles.banner, { color: success }]}>{doneMessage}</Text>
      ) : null}

      <Button
        onPress={handleSubmit}
        loading={loading}
        disabled={!email.trim()}
        style={styles.submit}
      >
        Send reset link
      </Button>

      <Button
        variant="ghost"
        onPress={() => router.replace('/auth/login')}
        style={styles.back}
      >
        Return to sign in
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 34,
    lineHeight: 40,
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
  submit: {
    borderRadius: 12,
    minHeight: 52,
    width: '100%',
  },
  back: {
    minHeight: 44,
  },
});
