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
import { selectHomeHeroBanners, selectHomePromoBanner } from '@/services/banners/bannerDisplay';
import { BrandStrip } from './BrandStrip';
import { CategorySidebar } from './CategorySidebar';
import { HeroSlider } from './HeroSlider';
import { HomeSearchBar } from './HomeSearchBar';
import { HomeFooter } from './HomeFooter';
import { NewArrivalsSection } from './NewArrivalsSection';
import { HomepageAdBanner } from './HomepageAdBanner';
import { SiteFooter } from './SiteFooter';
import { SpecialOffersSection } from './SpecialOffersSection';
import { TrendingProductsSection } from './TrendingProductsSection';
import { MobileHomeHeroBlock } from './mobile/MobileHomeHeroBlock';
import {
  HomeBrandsSkeleton,
  HomeHeroSkeleton,
  HomeSaleSkeleton,
  HomeSpecialSkeleton,
  HomeTrendingSkeleton,
  HomeUrgentSkeleton,
} from './HomeSkeleton';

const HERO_HEIGHT_DESKTOP = 420;
const HERO_HEIGHT_MOBILE = 360;

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

  const heroBanners = useMemo(
    () => selectHomeHeroBanners(data?.banners ?? []),
    [data?.banners]
  );

  const promoBanner = useMemo(
    () => selectHomePromoBanner(data?.banners ?? []),
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
              {!isWide ? (
                <>
                  <HomeHeroSkeleton isWide={false} />
                  <HomeSearchBar variant="glass" fullWidth compact />
                </>
              ) : (
                <HomeHeroSkeleton isWide={isWide} />
              )}
              <HomeUrgentSkeleton isWide={isWide} />
              <HomeTrendingSkeleton isWide={isWide} />
              <HomeSaleSkeleton isWide={isWide} />
              <HomeSpecialSkeleton isWide={isWide} />
              <HomeBrandsSkeleton />
            </SkeletonPulse>
          </HomeContentContainer>
        ) : !isWide ? (
          <>
            <MobileHomeHeroBlock
              banners={heroBanners}
              onBannerPress={onBannerPress}
              categories={categoryRoots}
              onCategorySelect={onCategorySelect}
            />

            <HomeContentContainer>
              <NewArrivalsSection
                products={urgent}
                onProductPress={onProductPress}
                onToggleFavorite={onToggleFavorite}
              />

              <LazySection
                fallback={
                  <SkeletonPulse>
                    <HomeTrendingSkeleton isWide={false} />
                    <HomeSaleSkeleton isWide={false} />
                  </SkeletonPulse>
                }
              >
                <TrendingProductsSection
                  products={trending}
                  onProductPress={onProductPress}
                  onToggleFavorite={onToggleFavorite}
                />
                <HomepageAdBanner
                  banner={promoBanner}
                  onPress={onBannerPress}
                />
              </LazySection>

              <LazySection
                fallback={
                  <SkeletonPulse>
                    <HomeSpecialSkeleton isWide={false} />
                  </SkeletonPulse>
                }
              >
                <SpecialOffersSection
                  products={specialOffers}
                  onProductPress={onProductPress}
                  onToggleFavorite={onToggleFavorite}
                />
              </LazySection>

              {data.brands.length > 0 ? (
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
            </HomeContentContainer>
          </>
        ) : (
          <HomeContentContainer>
            <View style={styles.heroRow}>
              <View style={styles.sidebar}>
                <CategorySidebar
                  categories={categoryRoots}
                  onSelect={onCategorySelect}
                  maxHeight={HERO_HEIGHT_DESKTOP}
                />
              </View>
              <View style={styles.hero}>
                <HeroSlider
                  slides={heroBanners}
                  onSlidePress={onBannerPress}
                  height={HERO_HEIGHT_DESKTOP}
                />
              </View>
            </View>

            <HomeSearchBar />

            <NewArrivalsSection
              products={urgent}
              onProductPress={onProductPress}
              onToggleFavorite={onToggleFavorite}
            />

            <LazySection
              fallback={
                <SkeletonPulse>
                  <HomeTrendingSkeleton isWide={isWide} />
                  <HomeSaleSkeleton isWide={isWide} />
                </SkeletonPulse>
              }
            >
              <TrendingProductsSection
                products={trending}
                onProductPress={onProductPress}
                onToggleFavorite={onToggleFavorite}
              />
              <HomepageAdBanner banner={promoBanner} onPress={onBannerPress} />
            </LazySection>

            <LazySection
              fallback={
                <SkeletonPulse>
                  <HomeSpecialSkeleton isWide={isWide} />
                </SkeletonPulse>
              }
            >
              <SpecialOffersSection
                products={specialOffers}
                onProductPress={onProductPress}
                onToggleFavorite={onToggleFavorite}
              />
            </LazySection>

            {data.brands.length > 0 ? (
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
    paddingTop: 0,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sidebar: { minWidth: 248, flexShrink: 0, paddingTop: 4, zIndex: 20 },
  hero: { flex: 1, minWidth: 0, zIndex: 1 },
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
