import React, { useCallback, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { AppHeader, useHeaderDrawers } from '@/components/layout';
import { HomeFeed } from '@/components/home';
import { MobileHomeTopBar } from '@/components/home/mobile/MobileHomeTopBar';
import { MobileMenuSheet } from '@/components/home/mobile/MobileMenuSheet';
import { ErrorState } from '@/components/ui';
import { useHomepageFeed } from '@/hooks/useHomepageFeed';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';
import {
  navigateHome,
  navigateToListings,
  type HeaderNavKey,
} from '@/services/navigation';
import type { ActiveBannerItem, CategoryTreeNode } from '@/types';

const SEO = {
  title: 'Haradan.com | At İlanları',
  description:
    'Satılık atlar, at hizmetleri ve aşım ilanları — Haradan.com.',
  url: 'https://haradan.com',
};

export default function HomeScreen() {
  const router = useRouter();
  const bg = useThemeColor('background');
  const isWide = useIsWideLayout();
  const { isLoggedIn } = useAuthSession();
  const drawers = useHeaderDrawers();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const onProductPress = useCallback(
    (id: string) => {
      router.push(`/advert/${id}`);
    },
    [router]
  );

  const onBannerPress = useCallback(
    (slide: ActiveBannerItem) => {
      if (!slide.targetUrl) return;
      if (/^https?:\/\//i.test(slide.targetUrl)) {
        Linking.openURL(slide.targetUrl).catch(() => {});
      } else {
        router.push(slide.targetUrl as `/listings`);
      }
    },
    [router]
  );

  const onCategorySelect = useCallback(
    (cat: CategoryTreeNode) => {
      navigateToListings(router, { category: cat.slug });
    },
    [router]
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
    if (!isLoggedIn) {
      router.push('/auth/login?next=/');
      return;
    }
    if (drawers) {
      drawers.openFavorites();
      return;
    }
    router.push('/(tabs)/favorites');
  }, [drawers, isLoggedIn, router]);

  const onMenuNav = useCallback(
    (key: HeaderNavKey) => {
      if (key === 'home') navigateHome(router);
      else if (key === 'listings') navigateToListings(router, {});
      else if (key === 'my-listings') {
        router.push(
          isLoggedIn ? '/my-listings' : '/auth/login?next=/my-listings'
        );
      }
    },
    [router, isLoggedIn]
  );

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

      {isWide ? (
        <AppHeader
          brandName="Haradan.com"
          isLoggedIn={isLoggedIn}
          categories={categoryRoots}
          onFavoritesPress={onOpenFavorites}
          onLoginPress={onLoginPress}
          onSignupPress={onSignupPress}
          onProfilePress={onProfilePress}
          onPostAdPress={onPostAdPress}
        />
      ) : null}

      {isError ? (
        <ErrorState variant="network" message={error} onRetry={refetch} />
      ) : (
        <>
          {!isWide ? (
            <MobileHomeTopBar
              onMenuPress={() => setMenuOpen(true)}
              onPostAdPress={onPostAdPress}
            />
          ) : null}
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
        </>
      )}

      {!isWide ? (
        <MobileMenuSheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          categories={categoryRoots}
          onNav={onMenuNav}
          onCategory={onCategorySelect}
          isLoggedIn={isLoggedIn}
          onLogin={onLoginPress}
          onPostAd={onPostAdPress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
});
