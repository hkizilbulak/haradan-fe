import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout';
import { ListingsView } from '@/components/listings/ListingsView';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';

function first(v: string | string[] | undefined): string | null {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default function ListingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    q?: string | string[];
    category?: string | string[];
    breed?: string | string[];
    province?: string | string[];
    min?: string | string[];
    max?: string | string[];
    urgent?: string | string[];
  }>();
  const bg = useThemeColor('background');
  const { isLoggedIn } = useAuthSession();
  const hydrated = useIsHydrated();

  const query = useMemo(() => {
    if (!hydrated) {
      return {
        q: null,
        category: null,
        breed: null,
        province: null,
        min: null,
        max: null,
        urgent: null,
      };
    }
    return {
      q: first(params.q),
      category: first(params.category),
      breed: first(params.breed),
      province: first(params.province),
      min: first(params.min),
      max: first(params.max),
      urgent: first(params.urgent),
    };
  }, [
    hydrated,
    params.q,
    params.category,
    params.breed,
    params.province,
    params.min,
    params.max,
    params.urgent,
  ]);

  const onLogin = useCallback(() => router.push('/auth/login'), [router]);
  const onSignup = useCallback(() => router.push('/auth/signup'), [router]);
  const onProfile = useCallback(() => router.push('/profile'), [router]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>İlanlar | Haradan.com</title>
          <meta
            name="description"
            content="Satılık atlar, at hizmetleri ve aşım ilanları."
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
        <ListingsView query={query} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});
