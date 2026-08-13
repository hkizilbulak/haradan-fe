import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { AuthLayout, LoginForm } from '@/components/auth';

export default function LoginScreen() {
  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>Giriş Yap | Haradan.com</title>
          <meta
            name="description"
            content="Haradan.com hesabınıza giriş yapın."
          />
        </Head>
      ) : null}
      <AuthLayout formKey="login" variant="luxury">
        <LoginForm />
      </AuthLayout>
    </>
  );
}
