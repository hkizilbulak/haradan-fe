import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { HeroSlider } from '../HeroSlider';
import { HomeSearchBar } from '../HomeSearchBar';
import { MobileHomeTopBar } from './MobileHomeTopBar';
import type { ActiveBannerItem } from '@/types';

const MOBILE_HERO_HEIGHT = 300;

type MobileHomeHeroBlockProps = {
  banners: ActiveBannerItem[];
  onBannerPress: (slide: ActiveBannerItem) => void;
  onMenuPress: () => void;
  onFavoritesPress: () => void;
  favoriteCount?: number;
};

export function MobileHomeHeroBlock({
  banners,
  onBannerPress,
  onMenuPress,
  onFavoritesPress,
  favoriteCount,
}: MobileHomeHeroBlockProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <HeroSlider
          slides={banners}
          onSlidePress={onBannerPress}
          height={MOBILE_HERO_HEIGHT}
          fullBleed
        />
        <View style={styles.scrim} pointerEvents="none" />
      </View>

      <MobileHomeTopBar
        onMenuPress={onMenuPress}
        onFavoritesPress={onFavoritesPress}
        badgeCount={favoriteCount}
      />

      <View style={styles.searchFloat}>
        <HomeSearchBar variant="glass" fullWidth compact />
      </View>
    </View>
  );
}

const SEARCH_OVERLAP = 28;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg + SEARCH_OVERLAP,
    position: 'relative',
  },
  hero: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,14,0.08)',
  },
  searchFloat: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: -SEARCH_OVERLAP,
    zIndex: 30,
  },
});
