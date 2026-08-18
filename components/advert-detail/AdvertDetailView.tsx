import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AdvertBundleOffer,
  AdvertBuyBox,
  AdvertDetailBanner,
  AdvertDetailTabs,
  AdvertGallery,
  AdvertReviews,
  AdvertShipping,
  AdvertSpecs,
  AdvertStickyCta,
  AdvertViewedRail,
} from '@/components/advert-detail';
import { LazySection } from '@/components/ui/LazySection';
import { RatingStars } from '@/components/product/RatingStars';
import { HomeContentContainer } from '@/components/layout';
import { SiteFooter } from '@/components/home';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlacementBanners } from '@/hooks/usePlacementBanners';
import { openPhoneCall, openWhatsApp } from '@/utils/contactLinks';
import { prepareListingWizardEntry } from '@/services/listing';
import type { AdvertDetail, AdvertDetailTab, CatalogProductCard } from '@/types';

type AdvertDetailViewProps = {
  detail: AdvertDetail;
  isOwner?: boolean;
  accessToken?: string | null;
};

export function AdvertDetailView({
  detail,
  isOwner = false,
  accessToken = null,
}: AdvertDetailViewProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const specsAnchorRef = useRef<View>(null);
  const reviewsAnchorRef = useRef<View>(null);
  const { toggle, apply } = useFavorites();
  const { banners: detailBanners } = usePlacementBanners('LISTING_DETAIL');

  const [tab, setTab] = useState<AdvertDetailTab>('general');
  const [showTop, setShowTop] = useState(false);

  const favoriteCard = useMemo((): CatalogProductCard => {
    return {
      id: detail.id,
      title: detail.title,
      publishedAt: detail.publishedAt,
      price: detail.price,
      categoryId: detail.categoryId,
      districtId: detail.districtId,
      provinceId: detail.provinceId,
      horseId: detail.horseId,
      cover: detail.cover ?? detail.gallery[0] ?? null,
      isFavorite: detail.isFavorite,
      packageCode: detail.packageCode,
      packageDisplayName: detail.packageDisplayName,
      packageBadgeText: detail.packageBadgeText,
      isUrgent: detail.isUrgent,
      urgentActivatedAt: detail.urgentActivatedAt,
      isFeatured: detail.isFeatured,
      featuredUntil: detail.featuredUntil,
      rating: detail.rating,
      reviewCount: detail.reviewCount,
      viewCount: detail.viewCount,
      oldPrice: detail.oldPrice,
      available: detail.available ? 1 : 0,
      brand: detail.brand,
    };
  }, [detail]);

  const favorite = apply([favoriteCard])[0]?.isFavorite === true;

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const bg = useThemeColor('background');

  useEffect(() => {
    setTab('general');
    scrollYRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [detail.id]);

  const tabs = useMemo(
    () =>
      [
        { key: 'general' as const, label: 'Genel bilgi' },
        { key: 'details' as const, label: 'İlan detayları' },
        {
          key: 'reviews' as const,
          label: `Değerlendirmeler (${detail.reviewCount || detail.reviews.length})`,
        },
      ] as const,
    [detail.reviewCount, detail.reviews.length]
  );

  const phone = detail.sellerPhone ?? '';

  const onCall = useCallback(() => {
    if (!phone) return;
    void openPhoneCall(phone);
  }, [phone]);

  const onWhatsApp = useCallback(() => {
    if (!phone) return;
    void openWhatsApp(
      phone,
      `Merhaba, Haradan'daki "${detail.title}" ilanı hakkında bilgi almak istiyorum.`
    );
  }, [phone, detail.title]);

  const onRelatedPress = useCallback(
    (id: string) => {
      router.push(`/advert/${id}`);
    },
    [router]
  );

  const scrollToAnchor = useCallback(
    (anchor: React.RefObject<View | null>, nativeId: string, attempt = 0) => {
      // Web: nativeID üzerinden DOM — RN ref bazen host node değil
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const el = document.getElementById(nativeId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (attempt < 12) {
          setTimeout(() => scrollToAnchor(anchor, nativeId, attempt + 1), 50);
        }
        return;
      }

      const node = anchor.current;
      const scroll = scrollRef.current;
      if (!node || !scroll) {
        if (attempt < 12) {
          setTimeout(() => scrollToAnchor(anchor, nativeId, attempt + 1), 50);
        }
        return;
      }

      node.measureInWindow((_x, targetY) => {
        const next = Math.max(0, scrollYRef.current + targetY - 80);
        scroll.scrollTo({ y: next, animated: true });
      });
    },
    []
  );

  const scrollToReviews = useCallback(() => {
    setTab('reviews');
    scrollToAnchor(reviewsAnchorRef, 'advert-reviews');
  }, [scrollToAnchor]);

  const onTabChange = useCallback(
    (key: AdvertDetailTab) => {
      setTab(key);
      if (key === 'reviews') {
        scrollToAnchor(reviewsAnchorRef, 'advert-reviews');
      } else if (key === 'details') {
        scrollToAnchor(specsAnchorRef, 'advert-specs');
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    },
    [scrollToAnchor]
  );

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS !== 'web'}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollYRef.current = y;
          setShowTop((prev) => {
            const next = y > 480;
            return prev === next ? prev : next;
          });
        }}
      >
        <HomeContentContainer>
          <View style={styles.crumbs}>
            {detail.breadcrumbs.map((crumb, i) => (
              <React.Fragment key={`${crumb.label}-${i}`}>
                {i > 0 ? (
                  <Text style={{ color: textMuted }}> › </Text>
                ) : null}
                <Pressable
                  onPress={() => crumb.href && router.push(crumb.href as '/')}
                  disabled={!crumb.href}
                >
                  <Text
                    style={{
                      color: crumb.href ? textMuted : text,
                      fontSize: 12,
                      fontWeight: crumb.href ? '400' : '600',
                    }}
                  >
                    {crumb.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          <Text style={[styles.title, { color: text }]}>{detail.title}</Text>

          <AdvertDetailTabs
            tabs={[...tabs]}
            active={tab}
            onChange={onTabChange}
            ratingSlot={
              <Pressable onPress={scrollToReviews} style={styles.ratingSlot}>
                <RatingStars
                  value={detail.rating}
                  count={detail.reviewCount || detail.reviews.length}
                  size={13}
                />
              </Pressable>
            }
          />

          <View style={[styles.hero, !isWide && styles.heroMobile]}>
            <View style={styles.galleryCol}>
              <AdvertGallery
                items={detail.gallery}
                height={isWide ? 440 : 320}
                accessToken={accessToken}
              />
            </View>
            <View style={styles.buyCol}>
              <AdvertBuyBox
                detail={detail}
                favorite={favorite}
                isOwner={isOwner}
                onToggleFavorite={() => toggle(favoriteCard)}
                onCall={onCall}
                onWhatsApp={onWhatsApp}
                onEdit={() => router.push(`/my-listings/edit/${detail.id}`)}
              />
              <AdvertShipping horse={detail.horse} />
              <AdvertDetailBanner banner={detailBanners[0] ?? null} />
            </View>
          </View>

          <LazySection
            fallback={
              <View
                style={{
                  marginVertical: 32,
                  height: 280,
                  borderRadius: 16,
                  backgroundColor: border,
                  opacity: 0.45,
                }}
              />
            }
          >
            <AdvertBundleOffer
              title="Öne çıkan ilanlar"
              items={detail.related}
              onPress={onRelatedPress}
            />
          </LazySection>

          <View style={[styles.lower, !isWide && styles.lowerMobile]}>
            <View style={styles.lowerMain}>
              {/* Eager mount — tab scroll hedefleri her zaman mevcut */}
              <View
                ref={specsAnchorRef}
                collapsable={false}
                nativeID="advert-specs"
              >
                <AdvertSpecs groups={detail.specs} horse={detail.horse} />
              </View>
              <View
                ref={reviewsAnchorRef}
                collapsable={false}
                nativeID="advert-reviews"
              >
                <AdvertReviews detail={detail} accessToken={accessToken} />
              </View>
            </View>

            {isWide ? (
              <View style={styles.stickyCol}>
                <View style={styles.stickyInner}>
                  <AdvertStickyCta
                    detail={detail}
                    favorite={favorite}
                    isOwner={isOwner}
                    accessToken={accessToken}
                    onCall={onCall}
                    onWhatsApp={onWhatsApp}
                    onToggleFavorite={() => toggle(favoriteCard)}
                    onEdit={() =>
                      router.push(`/my-listings/edit/${detail.id}`)
                    }
                  />
                </View>
              </View>
            ) : null}
          </View>

          <LazySection
            fallback={
              <View
                style={{
                  marginTop: 40,
                  height: 280,
                  borderRadius: 12,
                  backgroundColor: border,
                }}
              />
            }
          >
            <AdvertViewedRail
              items={detail.viewed}
              onPress={onRelatedPress}
            />
          </LazySection>
        </HomeContentContainer>

        <SiteFooter
          onPostAdPress={() => {
            prepareListingWizardEntry();
            router.push('/post');
          }}
          onNavPress={(key) => {
            if (key === 'listings') router.push('/listings');
          }}
        />
      </ScrollView>

      {showTop ? (
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          style={[
            styles.topBtn,
            { backgroundColor: surface, borderColor: border },
          ]}
          accessibilityLabel="Yukarı"
        >
          <Ionicons name="chevron-up" size={16} color={text} />
          <Text style={[styles.topLabel, { color: text }]}>TOP</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  flex: { flex: 1 },
  content: { paddingTop: Spacing.lg, paddingBottom: 0 },
  crumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: Spacing.md,
  },
  ratingSlot: { paddingBottom: 10 },
  hero: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
    alignItems: 'flex-start',
  },
  heroMobile: { flexDirection: 'column' },
  galleryCol: { flex: 1.15, minWidth: 0 },
  buyCol: { flex: 0.85, minWidth: 0 },
  lower: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
    alignItems: 'flex-start',
  },
  lowerMobile: { flexDirection: 'column' },
  lowerMain: { flex: 1.2, minWidth: 0, gap: Spacing['2xl'] },
  stickyCol: {
    flex: 0.8,
    minWidth: 260,
    maxWidth: 320,
  },
  stickyInner: {
    ...Platform.select({
      web: { position: 'sticky' as 'relative', top: 24 },
      default: {},
    }),
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
  topLabel: { fontSize: 9, fontWeight: '700' },
});
