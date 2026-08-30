import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HeroSlider } from '../HeroSlider';
import { HomeSearchBar } from '../HomeSearchBar';
import { CategoryStrip } from '../CategoryStrip';
import { QuickSearchStrip } from '../QuickSearchStrip';
import type { ActiveBannerItem, CategoryTreeNode } from '@/types';

type MobileHomeHeroBlockProps = {
  banners: ActiveBannerItem[];
  onBannerPress: (slide: ActiveBannerItem) => void;
  categories: CategoryTreeNode[];
  onCategorySelect: (cat: CategoryTreeNode) => void;
};

/** Mobil hero — BE banner cover + yüzen arama + premium kısayollar + slider altı önerilen aramalar. */
export function MobileHomeHeroBlock({
  banners,
  onBannerPress,
  categories,
  onCategorySelect,
}: MobileHomeHeroBlockProps) {
  const { width } = useWindowDimensions();
  const heroBg = useThemeColor('hero');

  const hasBanners = banners.length > 0;

  const heroHeight = useMemo(
    () => Math.min(Math.round(width * 1.08), 480),
    [width]
  );

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.hero,
          { height: heroHeight, backgroundColor: heroBg },
        ]}
      >
        {hasBanners ? (
          <HeroSlider
            slides={banners}
            onSlidePress={onBannerPress}
            height={heroHeight}
            fullBleed
            mobileCover
          />
        ) : null}

        <View style={styles.bottomPanel}>
          <HomeSearchBar variant="glass" fullWidth compact showQuickLinks={false} />
          <CategoryStrip
            variant="premium"
            categories={categories}
            onSelect={onCategorySelect}
          />
        </View>
      </View>

      <QuickSearchStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
  },
  bottomPanel: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    zIndex: 30,
    gap: 12,
  },
});
