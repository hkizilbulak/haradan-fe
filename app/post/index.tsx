import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostWizardView, PostEkuriWizardView } from '@/components/post';
import { hasEkuriDraft } from '@/services/listing';

export default function PostListingScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [listingMode, setListingMode] = useState<'single' | 'ekuri'>(() => {
    if (mode === 'ekuri') return 'ekuri';
    if (mode === 'single') return 'single';
    return hasEkuriDraft() ? 'ekuri' : 'single';
  });

  useEffect(() => {
    if (mode === 'ekuri' && listingMode !== 'ekuri') {
      setListingMode('ekuri');
    } else if (mode === 'single' && listingMode !== 'single') {
      setListingMode('single');
    }
  }, [mode]);

  const handleSwitchToSingle = () => {
    setListingMode('single');
    router.setParams({ mode: 'single' });
  };

  const handleSwitchToEkuri = () => {
    setListingMode('ekuri');
    router.setParams({ mode: 'ekuri' });
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
