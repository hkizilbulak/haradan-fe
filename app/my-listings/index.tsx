import React, { useCallback, useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout';
import { MyListingsView } from '@/components/my-listings';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';

export default function MyListingsScreen() {
  const router = useRouter();
  const bg = useThemeColor('background');
  const isWide = useIsWideLayout();
  const { isLoggedIn, session, ready } = useAuthSession();

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.replace('/auth/login?next=/my-listings');
    }
  }, [ready, isLoggedIn, router]);

  const onLogin = useCallback(() => router.push('/auth/login'), [router]);
  const onSignup = useCallback(() => router.push('/auth/signup'), [router]);
  const onProfile = useCallback(() => router.push('/profile'), [router]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>İlanlarım | Haradan.com</title>
          <meta
            name="description"
            content="Yayındaki, incelemedeki, reddedilen, taslak ve satılmış ilanlarınız."
          />
        </Head>
      ) : null}

      {isWide ? (
        <AppHeader
          brandName="Haradan.com"
          isLoggedIn={isLoggedIn}
          onLoginPress={onLogin}
          onSignupPress={onSignup}
          onProfilePress={onProfile}
          onPostAdPress={() => {
            prepareListingWizardEntry();
            router.push('/post');
          }}
        />
      ) : null}

      <SafeAreaView
        edges={isWide ? ['left', 'right', 'bottom'] : ['left', 'right']}
        style={styles.flex}
      >
        {session ? <MyListingsView accessToken={session.accessToken} /> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});
