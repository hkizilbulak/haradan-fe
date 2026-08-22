import React, { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { FeaturedListingCard } from '@/components/product/FeaturedListingCard';
import {
  HOME_CONTENT_MAX_WIDTH,
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import type { CatalogProductCard } from '@/types';
import { SectionHeader } from './SectionHeader';

type TrendingProductsSectionProps = {
  products: CatalogProductCard[];
  onViewAll?: () => void;
  onProductPress?: (id: string) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
};

/** Öne Çıkan İlanlar — acil ilanlarla aynı soft, çerçevesiz kart dili. */
export const TrendingProductsSection = memo(function TrendingProductsSection({
  products,
  onViewAll,
  onProductPress,
  onToggleFavorite,
}: TrendingProductsSectionProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const cols = isWide ? 4 : 2;
  const gap = isWide ? Spacing.lg : Spacing.md;
  const pad = homeContentPadding(isWide);
  const contentWidth = Math.min(width, HOME_CONTENT_MAX_WIDTH) - pad * 2;
  const colWidth = (contentWidth - gap * (cols - 1)) / cols;
  const items = useMemo(() => products.slice(0, 8), [products]);

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Öne Çıkan İlanlar"
        actionLabel="Tümünü gör"
        onActionPress={onViewAll}
      />
      <View style={[styles.grid, { gap }]}>
        {items.map((p) => (
          <FeaturedListingCard
            key={p.id}
            product={p}
            width={colWidth}
            compact={!isWide}
            badge="featured"
            onPress={onProductPress}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
