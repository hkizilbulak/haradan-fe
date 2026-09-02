import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  AdvertSpecs,
  AdvertStickyCta,
  AdvertViewedRail,
  type SpecsSubTab,
} from '@/components/advert-detail';
import { MobileAdvertStickyBar } from '@/components/advert-detail/mobile/MobileAdvertStickyBar';
import { MobileAdvertTopBar } from '@/components/advert-detail/mobile/MobileAdvertTopBar';
import { LazySection } from '@/components/ui/LazySection';
import { toast } from '@/components/ui';
import { RatingStars } from '@/components/product/RatingStars';
import { HomeContentContainer } from '@/components/layout';
import { SiteFooter } from '@/components/home';
import {
  HOME_DESKTOP_BREAKPOINT,
  mobileDetailScrollInset,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertId } from '@/types/advertId';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useFavorites } from '@/hooks/useFavorites';
import { usePlacementBanners } from '@/hooks/usePlacementBanners';
import { useAdvertLocation } from '@/services/location';
import { openPhoneCall, openWhatsApp } from '@/utils/contactLinks';
import { formatMoney } from '@/utils/formatMoney';
import { formatViewCount } from '@/utils/formatViewCount';
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
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const bodyOffsetYRef = useRef(0);
  const lowerFullYRef = useRef(0);
  const sectionLayoutYRef = useRef<Record<string, number>>({});
  const specsAnchorRef = useRef<View>(null);
  const reviewsAnchorRef = useRef<View>(null);
  const { toggle, apply } = useFavorites();
  const { banners: detailBanners } = usePlacementBanners('LISTING_DETAIL');
  const location = useAdvertLocation(detail);
  const safeInsets = useSafeInsets();
  const mobileScrollInset = mobileDetailScrollInset(safeInsets.bottom);

  const [tab, setTab] = useState<AdvertDetailTab>('general');
  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTab>('specs');
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
  const textSecondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const bg = useThemeColor('background');

  const galleryHeight = isWide
    ? 440
    : Math.min(Math.round(width * 0.78), 420);

  useEffect(() => {
    setTab('general');
    setSpecsSubTab('specs');
    scrollYRef.current = 0;
    sectionLayoutYRef.current = {};
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [detail.id]);

  const tabs = useMemo(() => {
    const list: { key: AdvertDetailTab; label: string }[] = [
      { key: 'general', label: 'İlan' },
      { key: 'details', label: 'Genel bilgiler' },
      {
        key: 'reviews',
        label: `Yorumlar (${detail.reviewCount || detail.reviews.length})`,
      },
    ];
    return list;
  }, [detail.reviewCount, detail.reviews.length]);

  const phone = detail.sellerPhone ?? '';

  const onCall = useCallback(() => {
    if (!phone) {
      toast.warning('Bu ilan için telefon numarası belirtilmemiş.', 'İletişim Bilgisi');
      return;
    }
    void openPhoneCall(phone);
  }, [phone]);

  const onWhatsApp = useCallback(() => {
    if (!phone) {
      toast.warning('Bu ilan için WhatsApp numarası belirtilmemiş.', 'İletişim Bilgisi');
      return;
    }
    void openWhatsApp(
      phone,
      `Merhaba, Haradan.com'daki "${detail.title}" ilanınız hakkında bilgi almak istiyorum.`
    );
  }, [phone, detail.title]);

  const onRelatedPress = useCallback(
    (id: AdvertId) => {
      router.push(`/advert/${id}`);
    },
    [router]
  );

  const onEdit = useCallback(() => {
    router.push(`/my-listings/edit/${detail.id}`);
  }, [router, detail.id]);

  const scrollToAnchor = useCallback(
    (anchor: React.RefObject<View | null>, nativeId: string, attempt = 0) => {
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

      const scroll = scrollRef.current;
      const offset = isWide ? 80 : 64;

      // 1. Check known onLayout coordinates
      let calculatedTargetY: number | null = null;
      if (nativeId === 'advert-specs') {
        const relY = sectionLayoutYRef.current['advert-specs'];
        if (typeof relY === 'number' && relY >= 0) {
          calculatedTargetY = (isWide ? 0 : (bodyOffsetYRef.current || 0)) + relY;
        }
      } else if (nativeId === 'advert-reviews') {
        const relY = sectionLayoutYRef.current['advert-reviews'];
        const lowerFullY = lowerFullYRef.current || 0;
        if (typeof relY === 'number' && relY >= 0) {
          calculatedTargetY = (isWide ? 0 : (bodyOffsetYRef.current || 0)) + lowerFullY + relY;
        }
      }

      if (calculatedTargetY != null && calculatedTargetY > 0 && scroll) {
        scroll.scrollTo({ y: Math.max(0, calculatedTargetY - offset), animated: true });
        return;
      }

      // 2. Fallback to node layout/window measurement
      const node = anchor.current;
      if (!node || !scroll) {
        if (attempt < 12) {
          setTimeout(() => scrollToAnchor(anchor, nativeId, attempt + 1), 50);
        }
        return;
      }

      try {
        const responder = (scroll as any).getScrollResponder?.() || scroll;
        node.measureLayout(
          responder as any,
          (_left: number, top: number) => {
            if (typeof top === 'number' && top > 0) {
              scroll.scrollTo({ y: Math.max(0, top - offset), animated: true });
            } else {
              node.measureInWindow((_x, winY) => {
                if (typeof winY === 'number' && !isNaN(winY) && winY > 0) {
                  const next = Math.max(0, scrollYRef.current + winY - offset);
                  scroll.scrollTo({ y: next, animated: true });
                }
              });
            }
          },
          () => {
            node.measureInWindow((_x, winY) => {
              if (typeof winY === 'number' && !isNaN(winY) && winY > 0) {
                const next = Math.max(0, scrollYRef.current + winY - offset);
                scroll.scrollTo({ y: next, animated: true });
              }
            });
          }
        );
      } catch {
        node.measureInWindow((_x, winY) => {
          if (typeof winY === 'number' && !isNaN(winY) && winY > 0) {
            const next = Math.max(0, scrollYRef.current + winY - offset);
            scroll.scrollTo({ y: next, animated: true });
          }
        });
      }
    },
    [isWide]
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
        setSpecsSubTab('specs');
        scrollToAnchor(specsAnchorRef, 'advert-specs');
      } else {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const topEl = document.getElementById('advert-top');
          if (topEl) {
            topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    },
    [scrollToAnchor]
  );

  const categoryLine =
    detail.breadcrumbs.length > 1
      ? detail.breadcrumbs[detail.breadcrumbs.length - 2]?.label
      : detail.horse.breed || 'İlan';

  const lowerSections = (
    <>
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

      <View
        style={styles.lowerFull}
        onLayout={(e) => {
          lowerFullYRef.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={{ marginBottom: Spacing.lg }}>
          <AdvertDetailBanner banner={detailBanners[0] ?? null} />
        </View>
        <View
          ref={reviewsAnchorRef}
          collapsable={false}
          nativeID="advert-reviews"
          onLayout={(e) => {
            sectionLayoutYRef.current['advert-reviews'] = e.nativeEvent.layout.y;
          }}
          style={Platform.select({
            web: { scrollMarginTop: isWide ? 90 : 70 } as any,
            default: {},
          })}
        >
          <AdvertReviews detail={detail} accessToken={accessToken} />
        </View>
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
        <AdvertViewedRail items={detail.viewed} onPress={onRelatedPress} />
      </LazySection>
    </>
  );

  if (!isWide) {
    return (
      <View style={[styles.root, { backgroundColor: bg }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.mobileContent,
            { paddingBottom: mobileScrollInset },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            scrollYRef.current = y;
            setShowTop((prev) => {
              const next = y > 520;
              return prev === next ? prev : next;
            });
          }}
        >
          <View nativeID="advert-top" style={styles.mobileGalleryWrap}>
            <AdvertGallery
              items={detail.gallery}
              height={galleryHeight}
              fullBleed
              showThumbs={false}
              accessToken={accessToken}
            />
            <MobileAdvertTopBar
              onBack={() => router.back()}
              favorite={favorite}
              onToggleFavorite={() => toggle(favoriteCard)}
            />
          </View>

          <HomeContentContainer
            style={styles.mobileBody}
            onLayout={(e) => {
              bodyOffsetYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.mobileSummary}>
              <View style={styles.mobileMetaRow}>
                <Text style={[styles.mobileCategory, { color: textMuted }]}>
                  {categoryLine}
                </Text>
                {detail.isUrgent ? (
                  <Text style={styles.mobileUrgent}>ACİL</Text>
                ) : null}
              </View>

              <Text style={[styles.mobileTitle, { color: text }]}>
                {detail.title}
              </Text>

              <View style={styles.mobilePriceRow}>
                <Text style={[styles.mobilePrice, { color: text }]}>
                  {formatMoney(detail.price)}
                </Text>
                {detail.oldPrice ? (
                  <Text style={[styles.mobileOldPrice, { color: textMuted }]}>
                    {formatMoney(detail.oldPrice)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.mobileSubRow}>
                <Ionicons name="location-outline" size={14} color={textMuted} />
                <Text
                  style={[styles.mobileSub, { color: textMuted }]}
                  numberOfLines={1}
                >
                  {location}
                </Text>
                <View style={[styles.mobileDot, { backgroundColor: textMuted }]} />
                <Ionicons name="eye-outline" size={14} color={textMuted} />
                <Text style={[styles.mobileSub, { color: textMuted }]}>
                  {formatViewCount(detail.viewCount)}
                </Text>
              </View>

              <Pressable onPress={scrollToReviews} style={styles.mobileRating}>
                <RatingStars
                  value={detail.rating}
                  count={detail.reviewCount || detail.reviews.length}
                  size={14}
                />
                <Ionicons name="chevron-forward" size={14} color={textSecondary} />
              </Pressable>
            </View>

            <AdvertDetailTabs
              tabs={[...tabs]}
              active={tab}
              onChange={onTabChange}
              variant="mobile"
            />

            <View style={styles.mobileSections}>
              <AdvertBuyBox
                detail={detail}
                favorite={favorite}
                isOwner={isOwner}
                variant="mobile"
                onToggleFavorite={() => toggle(favoriteCard)}
                onCall={onCall}
                onWhatsApp={onWhatsApp}
                onEdit={onEdit}
              />
            </View>

            <View
              ref={specsAnchorRef}
              collapsable={false}
              nativeID="advert-specs"
              onLayout={(e) => {
                sectionLayoutYRef.current['advert-specs'] = e.nativeEvent.layout.y;
              }}
              style={[
                { marginTop: Spacing.xl },
                Platform.select({
                  web: { scrollMarginTop: isWide ? 90 : 70 } as any,
                  default: {},
                }),
              ]}
            >
              <AdvertSpecs
                groups={detail.specs}
                horse={detail.horse}
                detail={detail}
                activeSubTab={specsSubTab}
                onSubTabChange={(t) => {
                  setSpecsSubTab(t);
                  setTab('details');
                }}
              />
            </View>

            {lowerSections}
          </HomeContentContainer>
        </ScrollView>

        <MobileAdvertStickyBar
          detail={detail}
          isOwner={isOwner}
          onCall={onCall}
          onWhatsApp={onWhatsApp}
          onEdit={onEdit}
        />

        {showTop ? (
          <Pressable
            onPress={() =>
              scrollRef.current?.scrollTo({ y: 0, animated: true })
            }
            style={[
              styles.topBtn,
              styles.topBtnMobile,
              { backgroundColor: surface, borderColor: border, bottom: mobileScrollInset - 8 },
            ]}
            accessibilityLabel="Yukarı"
          >
            <Ionicons name="chevron-up" size={16} color={text} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollYRef.current = y;
          setShowTop((prev) => {
            const next = y > 480;
            return prev === next ? prev : next;
          });
        }}
      >
        <HomeContentContainer nativeID="advert-top">
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

          <View style={styles.hero}>
            <View style={styles.galleryCol}>
              <AdvertGallery
                items={detail.gallery}
                height={galleryHeight}
                accessToken={isOwner ? accessToken : null}
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
                onEdit={onEdit}
              />
            </View>
          </View>

          <View
            ref={specsAnchorRef}
            collapsable={false}
            nativeID="advert-specs"
            onLayout={(e) => {
              sectionLayoutYRef.current['advert-specs'] = e.nativeEvent.layout.y;
            }}
            style={[
              { marginTop: Spacing['2xl'] },
              Platform.select({
                web: { scrollMarginTop: isWide ? 90 : 70 } as any,
                default: {},
              }),
            ]}
          >
            <AdvertSpecs
              groups={detail.specs}
              horse={detail.horse}
              detail={detail}
              activeSubTab={specsSubTab}
              onSubTabChange={(t) => {
                setSpecsSubTab(t);
                setTab('details');
              }}
            />
          </View>

          {lowerSections}
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
  content: { paddingTop: Spacing.lg, paddingBottom: 0, flexGrow: 1 },
  mobileContent: {},
  mobileGalleryWrap: {
    position: 'relative',
  },
  mobileBody: {
    paddingTop: Spacing.lg,
  },
  mobileSummary: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileCategory: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  mobileUrgent: {
    color: '#e11d48',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mobileTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  mobilePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  mobilePrice: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  mobileOldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  mobileSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mobileSub: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  mobileDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
    marginHorizontal: 2,
  },
  mobileRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  mobileSections: {
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
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
  galleryCol: { flex: 1.15, minWidth: 0, gap: Spacing.xl },
  buyCol: { flex: 0.85, minWidth: 0, gap: Spacing.xl },
  lowerFull: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.xl,
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
