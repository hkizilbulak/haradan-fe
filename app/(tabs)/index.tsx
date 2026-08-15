import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, useHeaderDrawers } from '@/components/layout';
import { HomeFeed } from '@/components/home';
import { ErrorState } from '@/components/ui';
import { useHomepageFeed } from '@/hooks/useHomepageFeed';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';
import type { ActiveBannerItem, CategoryTreeNode } from '@/types';

const SEO = {
  title: 'Haradan.com | At İlanları',
  description:
    'Satılık atlar, at hizmetleri ve aşım ilanları — Haradan.com.',
  url: 'https://haradan.com',
};

/**
 * Shell: header anında.
 * Feed: cache-first ATF + viewport lazy BTF.
 */
export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const bg = useThemeColor('background');
  const { isLoggedIn } = useAuthSession();
  const drawers = useHeaderDrawers();

  const {
    data,
    isError,
    error,
    refetch,
    categoryRoots,
    urgent,
    trending,
    specialOffers,
    toggleFavorite,
  } = useHomepageFeed();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onProductPress = useCallback((id: string) => {
    router.push(`/advert/${id}`);
  }, [router]);

  const onBannerPress = useCallback((slide: ActiveBannerItem) => {
    if (__DEV__) console.log('[home] banner', slide.targetUrl ?? slide.id);
  }, []);

  /** Aynı kategoriye 2. girişte stack/params no-op olmasın. */
  const onCategorySelect = useCallback(
    (cat: CategoryTreeNode) => {
      const href = {
        pathname: '/listings',
        params: { category: cat.slug },
      } as Href;
      if (pathname === '/listings' || pathname.startsWith('/listings')) {
        router.replace(href);
        return;
      }
      router.push(href);
    },
    [pathname, router]
  );

  const onPostAdPress = useCallback(() => {
    prepareListingWizardEntry();
    router.push('/post');
  }, [router]);

  const onLoginPress = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  const onSignupPress = useCallback(() => {
    router.push('/auth/signup');
  }, [router]);

  const onProfilePress = useCallback(() => {
    router.push('/profile');
  }, [router]);

  const onOpenFavorites = useCallback(() => {
    drawers?.openFavorites();
  }, [drawers]);

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{SEO.title}</title>
          <meta name="description" content={SEO.description} />
          <meta name="robots" content="index,follow" />
          <meta property="og:title" content={SEO.title} />
          <meta property="og:description" content={SEO.description} />
          <link rel="canonical" href={SEO.url} />
        </Head>
      ) : null}

      <AppHeader
        brandName="Haradan.com"
        isLoggedIn={isLoggedIn}
        onFavoritesPress={onOpenFavorites}
        onLoginPress={onLoginPress}
        onSignupPress={onSignupPress}
        onProfilePress={onProfilePress}
        onPostAdPress={onPostAdPress}
      />

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.flex}>
        {isError ? (
          <ErrorState variant="network" message={error} onRetry={refetch} />
        ) : (
          <HomeFeed
            data={data}
            categoryRoots={categoryRoots}
            urgent={urgent}
            trending={trending}
            specialOffers={specialOffers}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onProductPress={onProductPress}
            onBannerPress={onBannerPress}
            onCategorySelect={onCategorySelect}
            onPostAdPress={onPostAdPress}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  flex: { flex: 1 },
});
