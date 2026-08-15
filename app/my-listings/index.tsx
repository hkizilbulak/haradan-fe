import React, { useCallback, useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout';
import { MyListingsView } from '@/components/my-listings';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';

export default function MyListingsScreen() {
  const router = useRouter();
  const bg = useThemeColor('background');
  const { isLoggedIn, session } = useAuthSession();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth/login?next=/my-listings');
    }
  }, [isLoggedIn, router]);

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

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.flex}>
        {session ? <MyListingsView accessToken={session.accessToken} /> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});
