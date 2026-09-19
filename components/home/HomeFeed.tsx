import React, { memo, useMemo } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { HomeContentContainer } from '@/components/layout';
import { LazySection } from '@/components/ui/LazySection';
import { SkeletonPulse } from '@/components/ui/Skeleton';
import { HOME_DESKTOP_BREAKPOINT, mobileDockScrollInset } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';
import type {
  ActiveBannerItem,
  CatalogProductCard,
  CategoryTreeNode,
  HomepageData,
} from '@/types';
import type { AdvertId } from '@/types/advertId';
import { selectHomeHeroBanners } from '@/services/banners/bannerDisplay';
import { BrandStrip } from './BrandStrip';
import { CategoryStrip } from './CategoryStrip';
import { HomeHeroSection } from './HomeHeroSection';
import { NewArrivalsSection } from './NewArrivalsSection';
import { TrendingProductsSection } from './TrendingProductsSection';
import { CampaignsSliderSection } from './CampaignsSliderSection';
import { SiteFooter } from './SiteFooter';
import { HomeFooter } from './HomeFooter';
import {
  HomeBrandsSkeleton,
  HomeCategoriesSkeleton,
  HomeHeroSkeleton,
  HomeSaleSkeleton,
  HomeTrendingSkeleton,
  HomeUrgentSkeleton,
} from './HomeSkeleton';

type HomeFeedProps = {
  data: HomepageData | null;
  categoryRoots: CategoryTreeNode[];
  urgent: CatalogProductCard[];
  trending: CatalogProductCard[];
  specialOffers: CatalogProductCard[];
  refreshing: boolean;
  onRefresh: () => void;
  onProductPress: (id: AdvertId) => void;
  onBannerPress: (slide: ActiveBannerItem) => void;
  onCategorySelect: (cat: CategoryTreeNode) => void;
  onPostAdPress?: () => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
};

function HomeFeedComponent({
  data,
  categoryRoots,
  urgent,
  trending,
  specialOffers,
  refreshing,
  onRefresh,
  onProductPress,
  onBannerPress,
  onCategorySelect,
  onToggleFavorite,
}: HomeFeedProps) {
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const safeInsets = useSafeInsets();
  const mobileDockPad = mobileDockScrollInset(safeInsets.bottom);

  const primary = useThemeColor('primary');

  const campaignBanners = useMemo(
    () => selectHomeHeroBanners(data?.banners ?? []),
    [data?.banners]
  );

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          !isWide && { paddingBottom: mobileDockPad },
          !isWide && styles.contentMobile,
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS !== 'web'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primary}
            colors={[primary]}
          />
        }
      >
        {!data ? (
          <HomeContentContainer>
            <SkeletonPulse>
              <HomeHeroSkeleton isWide={isWide} />
              <HomeCategoriesSkeleton isWide={isWide} />
              <HomeUrgentSkeleton isWide={isWide} />
              <HomeTrendingSkeleton isWide={isWide} />
              <HomeSaleSkeleton isWide={isWide} />
              <HomeBrandsSkeleton />
            </SkeletonPulse>
          </HomeContentContainer>
        ) : (
          <HomeContentContainer>
            {/* 1. Hero & Arama (Search Bar + Dynamic Text + Quick Access Links) */}
            <HomeHeroSection />

            {/* 2. Kategoriler (Box-style cards flowing horizontally) */}
            <CategoryStrip
              categories={categoryRoots}
              onSelect={onCategorySelect}
            />

            {/* 3. Acil İlanlar (Hidden if empty; banner card at end if present) */}
            <NewArrivalsSection
              products={urgent}
              onProductPress={onProductPress}
              onToggleFavorite={onToggleFavorite}
            />

            {/* 4. Vitrin İlanları (Hidden if empty; ad-like banner inserted in middle) */}
            <LazySection
              fallback={
                <SkeletonPulse>
                  <HomeTrendingSkeleton isWide={isWide} />
                </SkeletonPulse>
              }
            >
              <TrendingProductsSection
                products={trending}
                onProductPress={onProductPress}
                onToggleFavorite={onToggleFavorite}
              />
            </LazySection>

            {/* 5. Kampanyalar (Slider format; click opens campaign detail) */}
            {campaignBanners.length > 0 ? (
              <LazySection
                fallback={
                  <SkeletonPulse>
                    <HomeSaleSkeleton isWide={isWide} />
                  </SkeletonPulse>
                }
              >
                <CampaignsSliderSection
                  banners={campaignBanners}
                  onBannerPress={onBannerPress}
                />
              </LazySection>
            ) : null}

            {/* 6. Markalar (İsteğe Bağlı Alt Blok) */}
            {data.brands && data.brands.length > 0 ? (
              <LazySection
                fallback={
                  <SkeletonPulse>
                    <HomeBrandsSkeleton />
                  </SkeletonPulse>
                }
              >
                <BrandStrip brands={data.brands} />
              </LazySection>
            ) : null}

            <HomeFooter />
          </HomeContentContainer>
        )}

        {isWide ? <SiteFooter /> : null}
      </ScrollView>
    </View>
  );
}

export const HomeFeed = memo(HomeFeedComponent);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: 0,
  },
  contentMobile: {
    paddingTop: 0,
  },
});
