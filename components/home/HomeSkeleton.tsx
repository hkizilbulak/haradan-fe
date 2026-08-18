import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Skeleton, SkeletonPulse } from '@/components/ui/Skeleton';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';

const HERO_DESKTOP = 420;
const HERO_MOBILE = 360;

function SectionTitleSkeleton() {
  return (
    <View style={styles.sectionHead}>
      <Skeleton width={220} height={28} borderRadius={8} />
      <Skeleton width={72} height={14} borderRadius={6} />
    </View>
  );
}

function ListingCardSkeleton({ width }: { width?: number | `${number}%` }) {
  return (
    <View style={[styles.listingCard, width ? { width } : styles.listingCardFlex]}>
      <Skeleton width="100%" aspectRatio={1} borderRadius={24} />
      <Skeleton width="88%" height={12} borderRadius={6} />
      <Skeleton width="54%" height={10} borderRadius={5} />
      <View style={styles.listingFooter}>
        <Skeleton width={72} height={14} borderRadius={6} />
        <Skeleton width={40} height={10} borderRadius={5} />
      </View>
    </View>
  );
}

export function HomeHeroSkeleton({ isWide }: { isWide: boolean }) {
  const heroH = isWide ? HERO_DESKTOP : HERO_MOBILE;

  return (
    <View style={[styles.heroRow, !isWide && styles.heroRowMobile]}>
      <View style={[styles.sidebar, !isWide && styles.sidebarMobile, { height: isWide ? heroH : 280 }]}>
        {Array.from({ length: isWide ? 8 : 5 }).map((_, i) => (
          <View key={i} style={styles.sidebarRow}>
            <Skeleton width={18} height={18} borderRadius={9} />
            <Skeleton width={i % 3 === 0 ? '72%' : '58%'} height={12} borderRadius={6} />
          </View>
        ))}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="100%" height={heroH} borderRadius={16} />
      </View>
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

export function HomeUrgentSkeleton({ isWide }: { isWide: boolean }) {
  return (
    <View style={styles.section}>
      <SectionTitleSkeleton />
      <View style={[styles.urgentRow, !isWide && styles.urgentRowMobile]}>
        <View style={[styles.featured, !isWide && styles.featuredMobile]}>
          <Skeleton width="100%" height={isWide ? 420 : 320} borderRadius={28} />
        </View>
        <View style={[styles.urgentList, !isWide && styles.urgentListMobile]}>
          {(isWide ? [0, 1] : [0]).map((col) => (
            <View key={col} style={styles.urgentCol}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={styles.urgentItem}>
                  <Skeleton width={92} height={92} borderRadius={22} />
                  <View style={styles.urgentCopy}>
                    <Skeleton width="90%" height={12} borderRadius={6} />
                    <Skeleton width="60%" height={10} borderRadius={5} />
                    <Skeleton width="40%" height={12} borderRadius={6} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function HomeTrendingSkeleton({ isWide }: { isWide: boolean }) {
  const cols = isWide ? 4 : 2;
  return (
    <View style={styles.section}>
      <SectionTitleSkeleton />
      <View style={styles.grid}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <ListingCardSkeleton key={i} width={isWide ? '23%' : '48%'} />
        ))}
      </View>
    </View>
  );
}

export function HomeSaleSkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width="100%" height={160} borderRadius={16} />
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

export function HomeBrandsSkeleton() {
  return (
    <View style={styles.brands}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width={88} height={22} borderRadius={6} />
      ))}
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
      <HomeSearchSkeleton />
      <HomeUrgentSkeleton isWide={isWide} />
      <HomeTrendingSkeleton isWide={isWide} />
      <HomeSaleSkeleton />
      <HomeSpecialSkeleton isWide={isWide} />
      <HomeBrandsSkeleton />
      <HomeNewsletterSkeleton />
    </SkeletonPulse>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  heroRowMobile: { flexDirection: 'column', gap: Spacing.md },
  sidebar: {
    minWidth: 248,
    flexShrink: 0,
    paddingTop: 8,
    gap: 18,
    justifyContent: 'center',
  },
  sidebarMobile: { width: '100%', minWidth: 0, height: 280 },
  sidebarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchWrap: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  section: { marginBottom: Spacing.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  urgentRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'stretch',
  },
  urgentRowMobile: { flexDirection: 'column', gap: Spacing.lg },
  featured: { width: '36%', minWidth: 260 },
  featuredMobile: { width: '100%', minWidth: 0 },
  urgentList: { flex: 1, flexDirection: 'row', gap: Spacing.lg },
  urgentListMobile: { flexDirection: 'column' },
  urgentCol: { flex: 1, gap: 14 },
  urgentItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  urgentCopy: { flex: 1, gap: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  listingCard: { gap: 12 },
  listingCardFlex: { flex: 1 },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  newsMobile: { flexDirection: 'column', gap: Spacing.xl },
  newsCopy: { flex: 1, gap: 12, maxWidth: 460 },
  newsCards: { flex: 1.05, gap: 14 },
  newsRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  newsRowCopy: { flex: 1, gap: 8 },
});
