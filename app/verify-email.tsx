import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { AuthLayout } from '@/components/auth';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { useAuthTheme } from '@/components/auth/AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';

function first(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? '';
  return raw ?? '';
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = first(params.token).trim();
  const { verifyEmail, loading, error } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const result = await verifyEmail(token);
      if (cancelled) return;
      if (result) {
        setMessage(result.message);
        setDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, verifyEmail]);

  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>E-posta doğrula | Haradan.com</title>
        </Head>
      ) : null}
      <AuthLayout formKey="verify" variant="luxury">
        <VerifyEmailBody
          token={token}
          loading={loading}
          error={error}
          message={message}
          done={done}
          onGoLogin={() =>
            router.replace({
              pathname: '/auth/login',
              params: { verified: '1' },
            })
          }
        />
      </AuthLayout>
    </>
  );
}

function VerifyEmailBody({
  token,
  loading,
  error,
  message,
  done,
  onGoLogin,
}: {
  token: string;
  loading: boolean;
  error: string | null;
  message: string | null;
  done: boolean;
  onGoLogin: () => void;
}) {
  const { tokens } = useAuthTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tokens.text }]}>E-posta doğrula</Text>
      {!token ? (
        <Text style={[styles.body, { color: tokens.textSecondary }]}>
          Doğrulama bağlantısı eksik veya geçersiz.
        </Text>
      ) : loading ? (
        <Text style={[styles.body, { color: tokens.textSecondary }]}>
          Doğrulanıyor…
        </Text>
      ) : done ? (
        <Text style={[styles.body, { color: tokens.textSecondary }]}>
          {message ?? 'E-posta adresi doğrulandı.'}
        </Text>
      ) : (
        <Text style={[styles.body, { color: tokens.error }]}>
          {error ?? 'Doğrulama başarısız.'}
        </Text>
      )}
      {done ? (
        <AuthSubmitButton label="Giriş yap" onPress={onGoLogin} />
      ) : (
        <Link href="/auth/login" style={[styles.link, { color: tokens.text }]}>
          Girişe dön
        </Link>
      )}
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
  },
  body: {
    ...Typography.body,
  },
  link: {
    ...Typography.small,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
