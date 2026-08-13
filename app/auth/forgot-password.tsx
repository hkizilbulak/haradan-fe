import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { AuthLayout, ForgotPasswordForm } from '@/components/auth';

export default function ForgotPasswordScreen() {
  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>Şifremi Unuttum | Haradan.com</title>
          <meta
            name="description"
            content="Haradan.com şifrenizi sıfırlayın."
          />
        </Head>
      ) : null}
      <AuthLayout formKey="forgot">
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
