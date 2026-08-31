import React, { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UrgentListingCard } from '@/components/product/UrgentListingCard';
import {
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
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

const MOBILE_GRID_GAP = 10;

/**
 * Acil Satılık İlanlar — Acil ilan yoksa HİÇ GELMEZ.
 * İlan varsa en sonuna "İlanınız burada yayınlansın" banner'ı yerleştirilir.
 */
export const NewArrivalsSection = memo(function NewArrivalsSection({
  products,
  onProductPress,
  onToggleFavorite,
  onViewAll,
}: NewArrivalsSectionProps) {
  const router = useRouter();
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  // STRICT check for urgent products: DO NOT show section if empty!
  const urgentItems = useMemo(() => {
    return products.filter((p) => p.isUrgent);
  }, [products]);

  const mobileColWidth = useMemo(() => {
    const pad = homeContentPadding(false);
    const contentWidth = width - pad * 2;
    return (contentWidth - MOBILE_GRID_GAP) / 2;
  }, [width]);

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

      <View style={[styles.grid, { gap: isWide ? Spacing.lg : MOBILE_GRID_GAP }]}>
        {urgentItems.map((p) => (
          <UrgentListingCard
            key={p.id}
            product={p}
            variant="tile"
            width={isWide ? 220 : mobileColWidth}
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
  bannerCard: {
    borderRadius: 20,
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    borderStyle: 'dashed',
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 280,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)',
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerBadgeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9f1239',
    lineHeight: 20,
    marginTop: 10,
  },
  bannerSub: {
    fontSize: 12,
    color: '#be123c',
    lineHeight: 16,
    marginVertical: 8,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  bannerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
