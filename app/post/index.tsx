import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostWizardView, PostEkuriWizardView } from '@/components/post';

export default function PostListingScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [listingMode, setListingMode] = useState<'single' | 'ekuri'>(() => {
    return mode === 'ekuri' ? 'ekuri' : 'single';
  });

  useEffect(() => {
    if (mode === 'ekuri') {
      setListingMode('ekuri');
    } else {
      setListingMode('single');
    }
  }, [mode]);

  const handleSwitchToSingle = () => {
    setListingMode('single');
    if (Platform.OS === 'web') {
      router.replace('/post?mode=single');
    } else {
      router.setParams({ mode: 'single' });
    }
  };

  const handleSwitchToEkuri = () => {
    setListingMode('ekuri');
    if (Platform.OS === 'web') {
      router.replace('/post?mode=ekuri');
    } else {
      router.setParams({ mode: 'ekuri' });
    }
  };

  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>
            {listingMode === 'ekuri'
              ? 'Eküri İlanı Ver | Haradan.com'
              : 'İlan Ver | Haradan.com'}
          </title>
          <meta
            name="description"
            content="Haradan.com’da at ilanı verin — tekil veya eküri toplu ilan."
          />
        </Head>
      ) : null}
      {listingMode === 'ekuri' ? (
        <PostEkuriWizardView
          onSwitchToSingle={handleSwitchToSingle}
          onClose={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
      ) : (
        <PostWizardView onSwitchToEkuri={handleSwitchToEkuri} />
      )}
    </>
  );
}
