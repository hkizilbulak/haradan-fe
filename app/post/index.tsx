import React from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { PostWizardView } from '@/components/post';

export default function PostListingScreen() {
  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>İlan Ver | Haradan.com</title>
          <meta
            name="description"
            content="Haradan.com’da at ilanı verin — tür, detay, paket ve ödeme."
          />
        </Head>
      ) : null}
      <PostWizardView />
    </>
  );
}
