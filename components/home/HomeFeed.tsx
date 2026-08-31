import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onProductPress: (id: string) => void;
  onBannerPress: (slide: ActiveBannerItem) => void;
  onCategorySelect: (cat: CategoryTreeNode) => void;
  onPostAdPress: () => void;
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
  onPostAdPress,
  onToggleFavorite,
}: HomeFeedProps) {
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const safeInsets = useSafeInsets();
  const mobileDockPad = mobileDockScrollInset(safeInsets.bottom);
  const scrollRef = useRef<ScrollView>(null);
  const [showTop, setShowTop] = useState(false);

  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const border = useThemeColor('border');

  const campaignBanners = useMemo(
    () => selectHomeHeroBanners(data?.banners ?? []),
    [data?.banners]
  );

  const onScroll = useCallback((y: number) => {
    setShowTop((prev) => {
      const next = y > 480;
      return prev === next ? prev : next;
    });
  }, []);

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          !isWide && { paddingBottom: mobileDockPad },
          !isWide && styles.contentMobile,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        removeClippedSubviews={Platform.OS !== 'web'}
        onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
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

        {isWide ? <SiteFooter onPostAdPress={onPostAdPress} /> : null}
      </ScrollView>

      {showTop ? (
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Yukarı çık"
          style={[
            styles.topBtn,
            !isWide && styles.topBtnMobile,
            !isWide && { bottom: mobileDockPad - 4 },
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          <Ionicons name="chevron-up" size={16} color={text} />
          {isWide ? (
            <Text style={[styles.topLabel, { color: text }]}>TOP</Text>
          ) : null}
        </Pressable>
      ) : null}
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
    paddingTop: Spacing.sm,
  },
  topBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  topBtnMobile: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  topLabel: { fontSize: 9, fontWeight: '700' },
});
