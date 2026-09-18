import React from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { AuthLayout, ResetPasswordForm } from '@/components/auth';

function first(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? '';
  return raw ?? '';
}

export default function AuthResetPasswordScreen() {
  const params = useLocalSearchParams<{
    token?: string | string[];
    email?: string | string[];
    autoLogin?: string | string[];
  }>();
  const token = first(params.token).trim();
  const email = first(params.email).trim();
  const autoLogin = first(params.autoLogin) === 'true';

  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>Şifrenizi Belirleyin | Haradan.com</title>
          <meta
            name="description"
            content="Haradan.com hesabınız için yeni şifrenizi belirleyin."
          />
        </Head>
      ) : null}
      <AuthLayout formKey="reset" variant="luxury">
        <ResetPasswordForm
          token={token}
          email={email}
          autoLogin={autoLogin}
        />
      </AuthLayout>
    </>
  );
}
