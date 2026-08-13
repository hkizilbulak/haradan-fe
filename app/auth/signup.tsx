import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { AuthLayout, SignupForm } from '@/components/auth';

export default function SignupScreen() {
  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>Hesap Oluştur | Haradan.com</title>
          <meta
            name="description"
            content="Haradan.com hesabı oluşturun."
          />
        </Head>
      ) : null}
      <AuthLayout formKey="signup" variant="luxury">
        <SignupForm />
      </AuthLayout>
    </>
  );
}
