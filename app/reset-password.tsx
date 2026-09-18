import React from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { AuthLayout, ResetPasswordForm } from '@/components/auth';

function first(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? '';
  return raw ?? '';
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = first(params.token).trim();

  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>Şifre Sıfırla | Haradan.com</title>
          <meta
            name="description"
            content="Haradan.com hesabınız için yeni şifrenizi belirleyin."
          />
        </Head>
      ) : null}
      <AuthLayout formKey="reset" variant="luxury">
        <ResetPasswordForm token={token} />
      </AuthLayout>
    </>
  );
}
