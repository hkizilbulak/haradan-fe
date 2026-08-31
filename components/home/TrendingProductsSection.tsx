import React, { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedListingCard } from '@/components/product/FeaturedListingCard';
import {
  HOME_CONTENT_MAX_WIDTH,
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { prepareListingWizardEntry } from '@/services/listing';
import type { CatalogProductCard } from '@/types';
import type { AdvertId } from '@/types/advertId';
import { SectionHeader } from './SectionHeader';

type TrendingProductsSectionProps = {
  products: CatalogProductCard[];
  onViewAll?: () => void;
  onProductPress?: (id: AdvertId) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
};

/** Vitrin İlanları — Yoksa gizlenir, varsa araya ilan gibi banner yerleştirilir. */
export const TrendingProductsSection = memo(function TrendingProductsSection({
  products,
  onViewAll,
  onProductPress,
  onToggleFavorite,
}: TrendingProductsSectionProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const cols = isWide ? 4 : 2;
  const gap = isWide ? Spacing.lg : Spacing.md;
  const pad = homeContentPadding(isWide);
  const contentWidth = Math.min(width, HOME_CONTENT_MAX_WIDTH) - pad * 2;
  const colWidth = (contentWidth - gap * (cols - 1)) / cols;

  const items = useMemo(() => products.slice(0, 7), [products]);

  const handlePostAd = useCallback(() => {
    prepareListingWizardEntry();
    router.push('/post');
  }, [router]);

  // If no showcase products, hide section completely!
  if (items.length === 0) return null;

  // Insert banner ad card at position index 2 (or middle of list)
  const bannerInsertIndex = Math.min(2, items.length);

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Vitrin İlanları"
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
  adCard: {
    borderRadius: 20,
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fef08a',
    borderStyle: 'dashed',
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 280,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(234, 179, 8, 0.1)',
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#ca8a04',
    fontSize: 11,
    fontWeight: '700',
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#854d0e',
    lineHeight: 20,
    marginTop: 10,
  },
  adSub: {
    fontSize: 12,
    color: '#a16207',
    lineHeight: 16,
    marginVertical: 8,
  },
  adBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ca8a04',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  adBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
