import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Skeleton, SkeletonPulse } from '@/components/ui/Skeleton';
import {
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

function SectionTitleSkeleton({ titleWidth = 200 }: { titleWidth?: number }) {
  return (
    <View style={styles.sectionHead}>
      <Skeleton width={titleWidth} height={26} borderRadius={8} />
      <Skeleton width={72} height={14} borderRadius={6} />
    </View>
  );
}

function ListingCardSkeleton({ width }: { width?: number | `${number}%` }) {
  return (
    <View style={[styles.listingCard, width ? { width } : styles.listingCardFlex]}>
      <Skeleton width="100%" aspectRatio={1} borderRadius={20} />
      <Skeleton width="88%" height={14} borderRadius={6} />
      <Skeleton width="55%" height={11} borderRadius={5} />
      <View style={styles.listingFooter}>
        <Skeleton width={72} height={16} borderRadius={6} />
        <Skeleton width={36} height={11} borderRadius={5} />
      </View>
    </View>
  );
}

export function HomeHeroSkeleton({ isWide }: { isWide: boolean }) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  return (
    <View style={[styles.heroContainer, !isWide && styles.heroContainerMobile]}>
      {/* Hero Banner Card */}
      <View
        style={[
          styles.heroCard,
          {
            minHeight: isWide ? 440 : 390,
            backgroundColor: surface,
            borderColor: border,
          },
          !isWide && styles.heroCardMobile,
        ]}
      >
        <View style={styles.heroContent}>
          {/* Animated Headline Placeholder */}
          <View style={styles.heroHeadlineContainer}>
            <Skeleton width={isWide ? 340 : 220} height={isWide ? 36 : 24} borderRadius={10} />
            <Skeleton width={isWide ? 260 : 180} height={isWide ? 36 : 24} borderRadius={10} />
          </View>

          {/* Search Box Placeholder */}
          <View style={[styles.heroSearchBox, isWide && styles.heroSearchBoxWide]}>
            <Skeleton width="100%" height={56} borderRadius={16} />
          </View>
        </View>
      </View>

      {/* Hızlı Erişim Linkleri Chips */}
      <View style={[styles.quickAccessSection, !isWide && styles.quickAccessSectionMobile]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessScroll}
        >
          {Array.from({ length: isWide ? 6 : 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.quickAccessChip,
                { backgroundColor: surface, borderColor: border },
              ]}
            >
              <Skeleton width={16} height={16} borderRadius={8} />
              <Skeleton width={i % 2 === 0 ? 88 : 72} height={13} borderRadius={6} />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

export function HomeCategoriesSkeleton({ isWide = true }: { isWide?: boolean }) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  return (
    <View style={styles.section}>
      <SectionTitleSkeleton titleWidth={130} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {Array.from({ length: isWide ? 8 : 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.categoryCard,
              { backgroundColor: surface, borderColor: border },
            ]}
          >
            <Skeleton width={44} height={44} borderRadius={14} />
            <Skeleton width={76} height={12} borderRadius={6} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function HomeUrgentSkeleton({ isWide }: { isWide: boolean }) {
  const count = isWide ? 5 : 2;

  return (
    <View style={styles.section}>
      <SectionTitleSkeleton titleWidth={190} />
      <View style={[styles.grid, { gap: isWide ? Spacing.lg : 10 }]}>
        {Array.from({ length: count }).map((_, i) => (
          <ListingCardSkeleton
            key={i}
            width={isWide ? 220 : '48%'}
          />
        ))}
      </View>
    </View>
  );
}

export function HomeTrendingSkeleton({ isWide }: { isWide: boolean }) {
  const count = isWide ? 4 : 2;

  return (
    <View style={styles.section}>
      <SectionTitleSkeleton titleWidth={160} />
      <View style={[styles.grid, { gap: isWide ? Spacing.lg : Spacing.md }]}>
        {Array.from({ length: count * 2 }).map((_, i) => (
          <ListingCardSkeleton
            key={i}
            width={isWide ? '23%' : '48%'}
          />
        ))}
      </View>
    </View>
  );
}

export function HomeSaleSkeleton({ isWide = true }: { isWide?: boolean }) {
  return (
    <View style={styles.section}>
      <Skeleton width="100%" height={isWide ? 180 : 120} borderRadius={20} />
    </View>
  );
}

export function HomeBrandsSkeleton() {
  return (
    <View style={styles.brands}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width={96} height={26} borderRadius={8} />
      ))}
    </View>
  );
}

export function HomeSearchSkeleton() {
  return (
    <View style={styles.searchWrap}>
      <Skeleton width="100%" height={52} borderRadius={14} />
    </View>
  );
}

export function HomeSpecialSkeleton({ isWide }: { isWide: boolean }) {
  const count = isWide ? 4 : 2;
  return (
    <View style={styles.section}>
      <SectionTitleSkeleton />
      <View style={styles.specialRow}>
        {Array.from({ length: count }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

export function HomeNewsletterSkeleton() {
  return (
    <View style={styles.news}>
      <View style={styles.newsCopy}>
        <Skeleton width={72} height={10} borderRadius={5} />
        <Skeleton width="80%" height={26} borderRadius={8} />
        <Skeleton width="70%" height={12} borderRadius={6} />
        <Skeleton width="100%" height={52} borderRadius={999} />
      </View>
    </View>
  );
}

/** Ana sayfa tam iskelet — gerçek layout ile aynı ritim. */
export function HomeSkeleton() {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  return (
    <SkeletonPulse>
      <HomeHeroSkeleton isWide={isWide} />
      <HomeCategoriesSkeleton isWide={isWide} />
      <HomeUrgentSkeleton isWide={isWide} />
      <HomeTrendingSkeleton isWide={isWide} />
      <HomeSaleSkeleton isWide={isWide} />
      <HomeBrandsSkeleton />
    </SkeletonPulse>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    marginBottom: Spacing.xl,
    position: 'relative',
    zIndex: 10,
  },
  heroContainerMobile: {
    marginHorizontal: -homeContentPadding(false),
    marginTop: 0,
    marginBottom: Spacing.lg,
  },
  heroCard: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
      },
      default: {},
    }),
  },
  heroCardMobile: {
    borderRadius: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: 36,
    paddingBottom: Spacing.xl,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  heroContent: {
    width: '100%',
    maxWidth: 860,
    alignItems: 'center',
  },
  heroHeadlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: 10,
  },
  heroSearchBox: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  heroSearchBoxWide: {
    maxWidth: 780,
  },
  quickAccessSection: {
    marginTop: Spacing.lg,
    width: '100%',
    overflow: 'hidden',
  },
  quickAccessSectionMobile: {
    paddingHorizontal: homeContentPadding(false),
  },
  quickAccessScroll: {
    gap: 8,
    paddingHorizontal: 0,
    paddingBottom: 4,
  },
  quickAccessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 42,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  categoriesScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  categoryCard: {
    width: 140,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  listingCard: {
    gap: 10,
  },
  listingCardFlex: {
    flex: 1,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  searchWrap: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  specialRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  brands: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
    paddingVertical: Spacing.md,
  },
  news: {
    flexDirection: 'row',
    gap: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  newsCopy: {
    flex: 1,
    gap: 12,
    maxWidth: 460,
  },
});

