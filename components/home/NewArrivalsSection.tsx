import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
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

type NewArrivalsSectionProps = {
  products: CatalogProductCard[];
  onProductPress?: (id: AdvertId) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
  onViewAll?: () => void;
};

/**
 * Acil Satılık İlanlar — Acil ilan yoksa HİÇ GELMEZ.
 * Web'de 4'lü, mobilde 2'li vitrin kartı düzeniyle gösterilir.
 */
export const NewArrivalsSection = memo(function NewArrivalsSection({
  products,
  onProductPress,
  onToggleFavorite,
  onViewAll,
}: NewArrivalsSectionProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const cols = isWide ? 4 : 2;
  const gap = isWide ? Spacing.lg : Spacing.md;
  const pad = homeContentPadding(isWide);
  const contentWidth = Math.min(width, HOME_CONTENT_MAX_WIDTH) - pad * 2;
  const colWidth = (contentWidth - gap * (cols - 1)) / cols;

  // STRICT check for urgent products: DO NOT show section if empty!
  const urgentItems = useMemo(() => {
    return products.filter((p) => p.isUrgent);
  }, [products]);

  const handlePostAd = useCallback(() => {
    prepareListingWizardEntry();
    router.push('/post');
  }, [router]);

  // If no urgent products, hide section completely!
  if (urgentItems.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Acil Satılık İlanlar"
        actionLabel="Tümünü gör"
        onActionPress={onViewAll}
      />

      <View style={[styles.grid, { gap, rowGap: isWide ? 28 : Spacing.md }]}>
        {urgentItems.map((p) => (
          <FeaturedListingCard
            key={p.id}
            product={p}
            width={colWidth}
            compact={!isWide}
            badge="urgent"
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
