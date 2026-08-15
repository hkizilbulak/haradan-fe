import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeContentContainer } from '@/components/layout';
import { LazySection } from '@/components/ui/LazySection';
import { SkeletonPulse } from '@/components/ui/Skeleton';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type {
  ActiveBannerItem,
  CatalogProductCard,
  CategoryTreeNode,
  HomepageData,
} from '@/types';
import { BrandStrip } from './BrandStrip';
import { CategorySidebar } from './CategorySidebar';
import { HeroSlider } from './HeroSlider';
import { HomeSearchBar } from './HomeSearchBar';
import { NewsletterBlogSection } from './NewsletterBlogSection';
import { NewArrivalsSection } from './NewArrivalsSection';
import { SaleBanner } from './SaleBanner';
import { SiteFooter } from './SiteFooter';
import { SpecialOffersSection } from './SpecialOffersSection';
import { TrendingProductsSection } from './TrendingProductsSection';
import {
  HomeBrandsSkeleton,
  HomeHeroSkeleton,
  HomeNewsletterSkeleton,
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
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const scrollRef = useRef<ScrollView>(null);
  const [showTop, setShowTop] = useState(false);

  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const border = useThemeColor('border');

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
        contentContainerStyle={styles.content}
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
        <HomeContentContainer>
          {!data ? (
            <SkeletonPulse>
              <HomeHeroSkeleton isWide={isWide} />
              <HomeSearchBar />
              <HomeUrgentSkeleton isWide={isWide} />
              <HomeTrendingSkeleton isWide={isWide} />
              <HomeSaleSkeleton />
              <HomeSpecialSkeleton isWide={isWide} />
              <HomeBrandsSkeleton />
              <HomeNewsletterSkeleton isWide={isWide} />
            </SkeletonPulse>
          ) : (
            <>
              <View style={[styles.heroRow, !isWide && styles.heroRowMobile]}>
                <View style={[styles.sidebar, !isWide && styles.sidebarMobile]}>
                  <CategorySidebar
                    categories={categoryRoots}
                    onSelect={onCategorySelect}
                    maxHeight={isWide ? HERO_HEIGHT_DESKTOP : 280}
                  />
                </View>
                <View style={[styles.hero, !isWide && styles.heroMobile]}>
                  <HeroSlider
                    slides={data.banners}
                    onSlidePress={onBannerPress}
                    height={isWide ? HERO_HEIGHT_DESKTOP : HERO_HEIGHT_MOBILE}
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
                    <HomeSaleSkeleton />
                  </SkeletonPulse>
                }
              >
                <TrendingProductsSection
                  products={trending}
                  onProductPress={onProductPress}
                  onToggleFavorite={onToggleFavorite}
                />
                <SaleBanner promo={data.salePromo} />
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

              <LazySection
                fallback={
                  <SkeletonPulse>
                    <HomeBrandsSkeleton />
                    <HomeNewsletterSkeleton isWide={isWide} />
                  </SkeletonPulse>
                }
              >
                <BrandStrip brands={data.brands} />
                <NewsletterBlogSection videos={data.blogVideos} />
              </LazySection>
            </>
          )}
        </HomeContentContainer>

        <SiteFooter onPostAdPress={onPostAdPress} />
      </ScrollView>

      {showTop ? (
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Back to top"
          style={[
            styles.topBtn,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          <Ionicons name="chevron-up" size={16} color={text} />
          <Text style={[styles.topLabel, { color: text }]}>TOP</Text>
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  heroRowMobile: { flexDirection: 'column', gap: Spacing.md },
  sidebar: { minWidth: 248, flexShrink: 0, paddingTop: 4, zIndex: 20 },
  sidebarMobile: { width: '100%', zIndex: 20 },
  hero: { flex: 1, minWidth: 0, zIndex: 1 },
  heroMobile: { width: '100%' },
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
  topLabel: { fontSize: 9, fontWeight: '700' },
});
