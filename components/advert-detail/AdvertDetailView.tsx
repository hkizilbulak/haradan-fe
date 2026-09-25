import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  AdvertActionBox,
  AdvertBundleOffer,
  AdvertBuyBox,
  AdvertDetailBanner,
  AdvertGallery,
  AdvertPedigree,
  AdvertReviews,
  AdvertSiblings,
  AdvertSpecs,
  AdvertStatistics,
  AdvertStickyCta,
  AdvertViewedRail,
  MobileAdvertStickyBar,
  PublishToggleConfirmModal,
  AdvertShareModal,
  type SpecsSubTab,
} from '@/components/advert-detail';
import { myListingsRepository } from '@/services/my-listings';
import { advertRepository } from '@/services/advert';
import { MobileAdvertTopBar } from '@/components/advert-detail/mobile/MobileAdvertTopBar';
import { getAdvertCategoryKind } from './advertCategoryHelper';
import { LazySection } from '@/components/ui/LazySection';
import { toast } from '@/components/ui';
import { HomeContentContainer } from '@/components/layout';
import { SiteFooter } from '@/components/home';
import {
  HOME_DESKTOP_BREAKPOINT,
  MOBILE_DETAIL_STICKY_BAR_HEIGHT,
  MOBILE_DOCK_BAR_HEIGHT,
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
import { openPhoneCall, openWhatsApp, WHATSAPP_GREEN } from '@/utils/contactLinks';
import { formatMoney } from '@/utils/formatMoney';
import { prepareListingWizardEntry, loadDraftIntoWizard, setListingWizardState } from '@/services/listing';
import type { AdvertDetail, CatalogProductCard } from '@/types';

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
  // Mobil görünümde yüzen CTA çubuğu + dock için dinamik scroll alt payı (variant="mobile")
  const mobileScrollInset = mobileDetailScrollInset(safeInsets.bottom);

  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTab>('specs');
  const [showTop, setShowTop] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>(
    detail.backendStatus || 'PUBLISHED'
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(
    detail.rejectionReason ?? null
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (detail.backendStatus) {
      setBackendStatus(detail.backendStatus);
    }
  }, [detail.backendStatus]);

  useEffect(() => {
    if (detail.rejectionReason) {
      setRejectionReason(detail.rejectionReason);
    }
  }, [detail.rejectionReason]);

  // İlan sahibi görüntülüyorsa, güncel statüyü teyit etmek için owner draft'ından oku
  useEffect(() => {
    if (!isOwner || !accessToken || !detail.id) return;
    myListingsRepository
      .getEditDraft(detail.id, accessToken)
      .then((payload) => {
        if (payload?.backendStatus) {
          setBackendStatus(payload.backendStatus);
        }
        if (payload?.rejectionReason) {
          setRejectionReason(payload.rejectionReason);
        }
      })
      .catch(() => {
        // Sessizce yutulabilir
      });
  }, [detail.id, isOwner, accessToken]);

  const isPublished = backendStatus === 'PUBLISHED';
  const isRejected = backendStatus === 'REJECTED';
  const isPendingReview = backendStatus === 'PENDING_REVIEW';
  const isChangesRequested = backendStatus === 'CHANGES_REQUESTED';
  const isSoldStatus = backendStatus === 'SOLD';
  const isArchived =
    backendStatus === 'ARCHIVED' ||
    backendStatus === 'SUSPENDED' ||
    backendStatus === 'archived' ||
    backendStatus === 'suspended' ||
    (!isPublished && !isRejected && !isPendingReview && !isChangesRequested && !isSoldStatus && backendStatus !== 'DRAFT');
  const canTogglePublish =
    (isPublished || backendStatus === 'ARCHIVED') &&
    !isRejected &&
    !isPendingReview &&
    !isChangesRequested &&
    !isSoldStatus;

  const onTogglePublish = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  const handleConfirmTogglePublish = useCallback(async () => {
    if (!accessToken) {
      toast.error('Oturum bilgisi bulunamadı. Lütfen giriş yapın.');
      setIsConfirmOpen(false);
      return;
    }

    setIsTogglingPublish(true);
    try {
      const draftPayload = await myListingsRepository.getEditDraft(detail.id, accessToken);
      const expectedVersion = draftPayload.version;

      if (isPublished) {
        await myListingsRepository.archive(detail.id, expectedVersion, accessToken);
        setBackendStatus('ARCHIVED');
        advertRepository.invalidate(detail.id);
        toast.success('İlan yayından kaldırıldı.');
      } else {
        await myListingsRepository.publish(detail.id, expectedVersion, accessToken);
        setBackendStatus('PUBLISHED');
        advertRepository.invalidate(detail.id);
        toast.success('İlan başarıyla yayına alındı.');
      }
      setIsConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.';
      toast.error(msg);
    } finally {
      setIsTogglingPublish(false);
    }
  }, [accessToken, detail.id, isPublished]);

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
  const primary = useThemeColor('primary');
  const header = useThemeColor('header');
  const bg = useThemeColor('background');

  const isSold = isSoldStatus;

  const noticeBannerConfig = useMemo(() => {
    if (!isOwner || isPublished) return null;

    if (isRejected) {
      return {
        type: 'rejected',
        title: 'Red Nedeni',
        subtitle: rejectionReason || 'Bu ilan moderasyon tarafından onaylanmadı.',
        icon: 'close-circle' as const,
        iconColor: '#ef4444',
        accentColor: '#ef4444',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        bgColor: 'rgba(239, 68, 68, 0.08)',
        iconCircleBg: 'rgba(239, 68, 68, 0.16)',
        showEditAction: false,
      };
    }

    if (isChangesRequested) {
      const cleanChangesReason = (rejectionReason || detail.rejectionReason || '')
        .replace(/^Talep Edilen Düzeltme:\s*/i, '')
        .trim();
      return {
        type: 'changes_requested',
        title: 'Düzeltme Talebi',
        subtitle:
          cleanChangesReason ||
          'Moderatörlerimiz ilanınızda bazı değişiklikler yapmanızı istedi. Lütfen ilanı düzenleyip tekrar onaya gönderin.',
        icon: 'alert-circle' as const,
        iconColor: '#f59e0b',
        accentColor: '#f59e0b',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        bgColor: 'rgba(245, 158, 11, 0.08)',
        iconCircleBg: 'rgba(245, 158, 11, 0.16)',
        showEditAction: false,
      };
    }

    if (isPendingReview) {
      return {
        type: 'pending_review',
        title: 'İlanınız İncelemede',
        subtitle: 'İlanınız moderatörlerimiz tarafından incelenmektedir. Onaylandıktan sonra otomatik olarak yayına alınacaktır.',
        icon: 'time' as const,
        iconColor: '#f59e0b',
        accentColor: '#f59e0b',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        bgColor: 'rgba(245, 158, 11, 0.08)',
        iconCircleBg: 'rgba(245, 158, 11, 0.16)',
        showEditAction: false,
      };
    }

    if (isSoldStatus) {
      return {
        type: 'sold',
        title: 'Bu İlan Satıldı Olarak İşaretlenmiştir',
        subtitle: 'İlanınız satıldı olarak işaretlendiği için yayından kaldırılmıştır.',
        icon: 'checkmark-circle' as const,
        iconColor: '#10b981',
        accentColor: '#10b981',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        bgColor: 'rgba(16, 185, 129, 0.08)',
        iconCircleBg: 'rgba(16, 185, 129, 0.16)',
        showEditAction: false,
      };
    }

    // ARCHIVED / SUSPENDED - Yayından Kaldırılmıştır
    const isPackageExpired = Boolean(
      rejectionReason?.toLowerCase().includes('paket süresi') ||
      rejectionReason?.toLowerCase().includes('package_expired')
    );
    const cleanReason = (rejectionReason || detail.rejectionReason || '')
      .replace(/^Yayından Kaldırılma Nedeni:\s*/i, '')
      .trim();

    return {
      type: 'archived',
      title: isPackageExpired
        ? 'Yayın Süresi Doldu'
        : cleanReason
        ? 'Yayından Kaldırılma Nedeni'
        : 'Bu İlan Yayından Kaldırılmıştır',
      subtitle: isPackageExpired
        ? 'Paket süresi bitmiştir. İlanınızın yayın süresi dolduğu için otomatik olarak yayından kaldırılmıştır.'
        : cleanReason ||
          'İlan yayından kaldırılmıştır; yalnızca siz görüntüleyebilirsiniz.',
      icon: 'eye-off' as const,
      iconColor: '#ef4444',
      accentColor: '#ef4444',
      borderColor: 'rgba(239, 68, 68, 0.28)',
      bgColor: 'rgba(239, 68, 68, 0.08)',
      iconCircleBg: 'rgba(239, 68, 68, 0.16)',
      showEditAction: false,
    };
  }, [isOwner, isPublished, isRejected, isChangesRequested, isPendingReview, isSoldStatus, rejectionReason, detail.rejectionReason]);

  const galleryHeight = isWide
    ? 440
    : Math.round(width / (694.6 / 440));

  const horse = detail.horse;
  const categoryKind = useMemo(() => getAdvertCategoryKind(detail), [detail]);
  const isHorseOrStud = categoryKind === 'horse' || categoryKind === 'stud';

  const hasPedigree = Boolean(isHorseOrStud && horse?.pedigree && horse.pedigree.length > 0);
  const hasSiblings = Boolean(isHorseOrStud && horse?.siblings && horse.siblings.length > 0);
  const hasStatistics = Boolean(
    isHorseOrStud && (
      (horse?.statistics && horse.statistics.length > 0) ||
      horse?.detailProfile?.handicapPoint ||
      (horse?.handicap != null && horse.handicap > 0)
    )
  );

  const hasHorseData = Boolean(
    isHorseOrStud &&
    horse && (
      (horse.registeredName && horse.registeredName !== 'Başlıksız ilan' && horse.registeredName.trim() !== '') ||
      horse.sire ||
      horse.dam ||
      horse.damsire ||
      (horse.age != null && Boolean(horse.age) && horse.age !== 0) ||
      horse.gender ||
      horse.coatColor ||
      horse.breed ||
      (horse.career && horse.career.starts > 0) ||
      (horse.races && horse.races.length > 0)
    )
  );

  const subTabs = useMemo(() => {
    const list: {
      key: SpecsSubTab;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      badge?: string;
    }[] = [];

    list.push({ key: 'specs', label: 'Genel Bilgiler', icon: 'information-circle-outline' });

    if (hasPedigree || (hasHorseData && (horse?.sire || horse?.dam))) {
      list.push({ key: 'pedigree', label: 'Pedigri (Soyağacı)', icon: 'git-branch-outline' });
    }
    if (hasStatistics || hasHorseData) {
      list.push({ key: 'statistics', label: 'İstatistikler', icon: 'stats-chart-outline' });
    }
    if (hasHorseData || hasSiblings) {
      list.push({
        key: 'siblings',
        label: 'Anne Kardeşleri',
        icon: 'people-outline',
        badge: horse?.siblings && horse.siblings.length > 0 ? String(horse.siblings.length) : undefined,
      });
    }
    return list;
  }, [hasPedigree, hasStatistics, hasHorseData, hasSiblings, horse?.sire, horse?.dam, horse?.siblings]);

  useEffect(() => {
    setSpecsSubTab('specs');
    scrollYRef.current = 0;
    sectionLayoutYRef.current = {};
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [detail.id, isWide]);

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
    if (detail.sellerPhone && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('haradan.lastSellerPhone', detail.sellerPhone);
      } catch {}
    }
    router.push(`/my-listings/edit/${detail.id}`);
  }, [router, detail.id, detail.sellerPhone]);

  const onPromote = useCallback(async () => {
    if (!accessToken) {
      toast.error('Oturum bilgisi bulunamadı. Lütfen giriş yapın.');
      return;
    }
    try {
      const payload = await myListingsRepository.getEditDraft(detail.id, accessToken);
      if (payload?.draft) {
        const effectiveStatus = payload.backendStatus ?? backendStatus ?? detail.backendStatus ?? 'PUBLISHED';
        const activePackageCode = detail.packageCode || payload.draft.packageCode || 'STANDARD';
        loadDraftIntoWizard(
          {
            ...payload.draft,
            packageCode: activePackageCode as any,
          },
          detail.id,
          effectiveStatus
        );
        setListingWizardState((prev) => ({
          ...prev,
          step: 'package',
          submittedStatus: effectiveStatus,
          draft: {
            ...prev.draft,
            packageCode: activePackageCode as any,
            serverVersion: payload.version ?? prev.draft.serverVersion,
            mediaVersion: payload.mediaVersion ?? prev.draft.mediaVersion,
          },
        }));
        router.push('/post');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İlan bilgileri alınamadı.';
      toast.error(msg);
    }
  }, [detail.id, detail.packageCode, backendStatus, detail.backendStatus, accessToken, router]);

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
    scrollToAnchor(reviewsAnchorRef, 'advert-reviews');
  }, [scrollToAnchor]);

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

      {!isWide && (
        <View
          style={styles.lowerFull}
          onLayout={(e) => {
            lowerFullYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <AdvertDetailBanner banner={detailBanners[0] ?? null} />
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
      )}

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
              accessToken={accessToken}
            />
            <MobileAdvertTopBar
              onBack={() => router.back()}
              showFavorite={detail.backendStatus !== 'REJECTED' && !isOwner}
              favorite={favorite}
              onToggleFavorite={() => toggle(favoriteCard)}
              onShare={isPublished ? () => setIsShareModalOpen(true) : undefined}
            />
          </View>

          <HomeContentContainer
            style={styles.mobileBody}
            onLayout={(e) => {
              bodyOffsetYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.mobileSummary}>
              {noticeBannerConfig ? (
                <View
                  style={[
                    styles.unpublishedNoticeBannerMobile,
                    {
                      borderColor: noticeBannerConfig.borderColor,
                      backgroundColor: noticeBannerConfig.bgColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={noticeBannerConfig.icon}
                    size={18}
                    color={noticeBannerConfig.iconColor}
                    style={{ marginTop: 1 }}
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={[
                        styles.unpublishedNoticeTitleMobile,
                        { color: noticeBannerConfig.accentColor },
                      ]}
                    >
                      {noticeBannerConfig.title}
                    </Text>
                    <Text style={styles.unpublishedNoticeSubtitleMobile}>
                      {noticeBannerConfig.subtitle}
                    </Text>
                    {noticeBannerConfig.showEditAction ? (
                      <Pressable
                        onPress={onEdit}
                        style={({ pressed }) => [
                          styles.bannerEditBtnMobile,
                          {
                            borderColor: noticeBannerConfig.accentColor,
                            backgroundColor: `${noticeBannerConfig.accentColor}20`,
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Ionicons
                          name="create-outline"
                          size={14}
                          color={noticeBannerConfig.accentColor}
                        />
                        <Text
                          style={[
                            styles.bannerEditBtnTextMobile,
                            { color: noticeBannerConfig.accentColor },
                          ]}
                        >
                          İlanı Düzenle
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <Text style={[styles.mobileTitle, { color: text }]}>
                {detail.title}
              </Text>

              {/* Fiyat ve Konum (Title altında: Sol Konum, Sağ Fiyat) */}
              <View style={styles.mobilePriceLocationWrap}>
                <View style={styles.mobileLocationRow}>
                  {location && location !== '-' && location.trim() !== '' ? (
                    <>
                      <Ionicons name="location-outline" size={15} color={primary} />
                      <Text style={[styles.mobileLocationText, { color: textSecondary }]} numberOfLines={1}>
                        {location}
                      </Text>
                    </>
                  ) : null}
                </View>

                <Text style={[styles.mobilePrice, { color: text }]}>
                  {formatMoney(detail.price)}
                </Text>
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
                { marginTop: Spacing.md },
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
                }}
              />
            </View>

            {lowerSections}
          </HomeContentContainer>
        </ScrollView>

        {/* Sabit Alt İletişim Çubuğu (Ara & WhatsApp) */}
        <MobileAdvertStickyBar
          detail={{ ...detail, backendStatus }}
          isOwner={isOwner}
          isPublished={isPublished}
          onCall={onCall}
          onWhatsApp={onWhatsApp}
          onEdit={onEdit}
          onPromote={onPromote}
          onTogglePublish={onTogglePublish}
          isTogglingPublish={isTogglingPublish}
        />

        {showTop ? (
          <Pressable
            onPress={() =>
              scrollRef.current?.scrollTo({ y: 0, animated: true })
            }
            style={[
              styles.topBtn,
              styles.topBtnMobile,
              { backgroundColor: surface, borderColor: border, bottom: safeInsets.bottom + 16 },
            ]}
            accessibilityLabel="Yukarı"
          >
            <Ionicons name="chevron-up" size={16} color={text} />
          </Pressable>
        ) : null}

        <PublishToggleConfirmModal
          visible={isConfirmOpen}
          isPublished={isPublished}
          title={detail.title}
          loading={isTogglingPublish}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmTogglePublish}
        />

        <AdvertShareModal
          visible={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          detail={detail}
        />
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

          {/* Başlık ve Masaüstü Red / Düzeltme / Yayından Kaldırılma Nedeni */}
          <View style={styles.desktopTitleRow}>
            <View style={styles.desktopTitleCol}>
              <Text style={[styles.title, { color: text, marginBottom: 0 }]}>
                {detail.title}
              </Text>
            </View>
            {(isRejected || isChangesRequested || isArchived) && noticeBannerConfig ? (
              <View style={styles.desktopTitleActionCol}>
                <View
                  style={[
                    styles.unpublishedNoticeBanner,
                    styles.rejectionReasonBanner,
                    {
                      borderColor: noticeBannerConfig.borderColor,
                      backgroundColor: noticeBannerConfig.bgColor,
                    },
                  ]}
                >
                  <View style={styles.rejectionReasonHeader}>
                    <Ionicons
                      name={noticeBannerConfig.icon}
                      size={16}
                      color={noticeBannerConfig.iconColor}
                    />
                    <Text
                      style={[
                        styles.rejectionReasonTitle,
                        { color: noticeBannerConfig.accentColor },
                      ]}
                    >
                      {noticeBannerConfig.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.rejectionReasonText,
                      { color: text },
                    ]}
                  >
                    {noticeBannerConfig.subtitle}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {noticeBannerConfig && !isRejected && !isChangesRequested && !isArchived ? (
            <View
              style={[
                styles.unpublishedNoticeBanner,
                {
                  borderColor: noticeBannerConfig.borderColor,
                  backgroundColor: noticeBannerConfig.bgColor,
                },
              ]}
            >
              <View style={styles.unpublishedNoticeLeft}>
                <View
                  style={[
                    styles.unpublishedNoticeIconCircle,
                    { backgroundColor: noticeBannerConfig.iconCircleBg },
                  ]}
                >
                  <Ionicons
                    name={noticeBannerConfig.icon}
                    size={20}
                    color={noticeBannerConfig.iconColor}
                  />
                </View>
                <View style={styles.unpublishedNoticeTextWrap}>
                  <Text
                    style={[
                      styles.unpublishedNoticeTitle,
                      { color: noticeBannerConfig.accentColor },
                    ]}
                  >
                    {noticeBannerConfig.title}
                  </Text>
                  <Text style={styles.unpublishedNoticeSubtitle}>
                    {noticeBannerConfig.subtitle}
                  </Text>
                </View>
              </View>
              {noticeBannerConfig.showEditAction ? (
                <Pressable
                  onPress={onEdit}
                  style={({ pressed }) => [
                    styles.bannerEditBtn,
                    {
                      borderColor: noticeBannerConfig.accentColor,
                      backgroundColor: `${noticeBannerConfig.accentColor}20`,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="İlanı Düzenle"
                >
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={noticeBannerConfig.accentColor}
                  />
                  <Text
                    style={[
                      styles.bannerEditBtnText,
                      { color: noticeBannerConfig.accentColor },
                    ]}
                  >
                    İlanı Düzenle
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Sub Tabs & Desktop Action Bar (Üst Bar - Kolon Hizalı) */}
          <View style={styles.desktopTopNavRow}>
            {/* Sol: Sekmeler (Galeri Kolonu Hizası) */}
            <View style={styles.desktopTopTabsCol}>
              <View style={styles.subTabsContainer}>
                {subTabs.map((t) => {
                  const isActive = t.key === specsSubTab;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setSpecsSubTab(t.key)}
                      style={[
                        styles.subTabButton,
                        {
                          backgroundColor: isActive ? primary : surface,
                          borderColor: isActive ? primary : border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={t.icon}
                        size={16}
                        color={isActive ? '#ffffff' : textSecondary}
                      />
                      <Text
                        style={[
                          styles.subTabButtonText,
                          {
                            color: isActive ? '#ffffff' : text,
                            fontWeight: isActive ? '700' : '600',
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                      {t.badge ? (
                        <View
                          style={[
                            styles.subTabBadge,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255, 255, 255, 0.25)'
                                : `${primary}15`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subTabBadgeText,
                              { color: isActive ? '#ffffff' : primary },
                            ]}
                          >
                            {t.badge}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Sağ: Ara & WhatsApp & Favori Butonları (Detay Kolonu Hizası) */}
            <View style={styles.desktopTopActionsCol}>
              {isOwner ? (
                <>
                  {canTogglePublish ? (
                    <Pressable
                      onPress={onTogglePublish}
                      disabled={isTogglingPublish}
                      accessibilityRole="button"
                      accessibilityLabel={isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                      style={({ pressed }) => [
                        styles.desktopTopPublishBtn,
                        isPublished
                          ? {
                              borderColor: '#ef444445',
                              backgroundColor: '#ef444414',
                            }
                          : {
                              borderColor: '#10b98145',
                              backgroundColor: '#10b98118',
                            },
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      {isTogglingPublish ? (
                        <ActivityIndicator
                          size="small"
                          color={isPublished ? '#ef4444' : '#10b981'}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name={isPublished ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={isPublished ? '#ef4444' : '#10b981'}
                          />
                          <Text
                            style={[
                              styles.desktopTopPublishText,
                              { color: isPublished ? '#ef4444' : '#10b981' },
                            ]}
                          >
                            {isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {isPublished ? (
                    <Pressable
                      onPress={onPromote}
                      accessibilityRole="button"
                      accessibilityLabel="Öne Çıkar"
                      style={({ pressed }) => [
                        styles.desktopTopEditBtn,
                        { borderColor: '#f59e0b45', backgroundColor: '#f59e0b14' },
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Ionicons name="star-outline" size={16} color="#f59e0b" />
                      <Text style={[styles.desktopTopEditText, { color: '#f59e0b' }]}>Öne Çıkar</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={onEdit}
                    accessibilityRole="button"
                    accessibilityLabel="İlanı Düzenle"
                    style={({ pressed }) => [
                      styles.desktopTopEditBtn,
                      isRejected
                        ? {
                            borderColor: '#ef4444',
                            backgroundColor: '#ef444418',
                            paddingHorizontal: 16,
                          }
                        : { borderColor: border, backgroundColor: surface },
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={isRejected ? '#ef4444' : text}
                    />
                    <Text
                      style={[
                        styles.desktopTopEditText,
                        {
                          color: isRejected ? '#ef4444' : text,
                          fontWeight: isRejected ? '700' : '600',
                        },
                      ]}
                    >
                      {isRejected ? 'İlanı Düzenle ve Tekrar Gönder' : 'İlanı Düzenle'}
                    </Text>
                  </Pressable>

                  {isPublished ? (
                    <Pressable
                      onPress={() => setIsShareModalOpen(true)}
                      accessibilityRole="button"
                      accessibilityLabel="İlanı Paylaş"
                      style={({ pressed }) => [
                        styles.desktopTopShareBtn,
                        { borderColor: border, backgroundColor: surface, borderWidth: 1.5 },
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Ionicons name="share-social-outline" size={18} color={text} />
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <>
                  <Pressable
                    onPress={isSold ? undefined : onCall}
                    disabled={isSold}
                    style={({ pressed }) => [
                      styles.desktopTopCtaCall,
                      { backgroundColor: isSold ? '#9ca3af' : header },
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={styles.desktopTopCtaText}>{isSold ? 'Satıldı' : 'Ara'}</Text>
                  </Pressable>

                  <Pressable
                    onPress={isSold ? undefined : onWhatsApp}
                    disabled={isSold}
                    style={({ pressed }) => [
                      styles.desktopTopCtaWhatsApp,
                      { backgroundColor: isSold ? '#9ca3af' : WHATSAPP_GREEN },
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <Ionicons name="logo-whatsapp" size={17} color="#fff" />
                    <Text style={styles.desktopTopCtaText}>WhatsApp</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggle(favoriteCard)}
                    style={({ pressed }) => [
                      styles.desktopTopFavBtn,
                      { borderColor: border, backgroundColor: surface },
                      pressed && { opacity: 0.8 },
                    ]}
                    accessibilityLabel={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  >
                    <Ionicons
                      name={favorite ? 'heart' : 'heart-outline'}
                      size={19}
                      color={favorite ? '#ef4444' : textSecondary}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => setIsShareModalOpen(true)}
                    style={({ pressed }) => [
                      styles.desktopTopShareBtn,
                      { borderColor: border, backgroundColor: surface },
                      pressed && { opacity: 0.8 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="İlanı Paylaş"
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={19}
                      color={textSecondary}
                    />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Tab Content: Genel Bilgiler */}
          {specsSubTab === 'specs' && (
            <View style={styles.hero}>
              <View style={styles.galleryCol}>
                <AdvertGallery
                  items={detail.gallery}
                  height={galleryHeight}
                  accessToken={isOwner ? accessToken : null}
                />
                <View
                  ref={reviewsAnchorRef}
                  collapsable={false}
                  nativeID="advert-reviews"
                  onLayout={(e) => {
                    sectionLayoutYRef.current['advert-reviews'] = e.nativeEvent.layout.y;
                  }}
                  style={Platform.select({
                    web: { scrollMarginTop: 90 } as any,
                    default: {},
                  })}
                >
                  <AdvertReviews detail={detail} accessToken={accessToken} />
                </View>
              </View>
              <View style={styles.buyCol}>
                <AdvertBuyBox
                  detail={{
                    ...detail,
                    rejectionReason: rejectionReason || detail.rejectionReason,
                    backendStatus: backendStatus || detail.backendStatus,
                  }}
                  variant="default"
                  favorite={favorite}
                  isOwner={isOwner}
                  onToggleFavorite={() => toggle(favoriteCard)}
                  onCall={onCall}
                  onWhatsApp={onWhatsApp}
                  onEdit={onEdit}
                />
                <AdvertDetailBanner banner={detailBanners[0] ?? null} />
              </View>
            </View>
          )}

          {/* Tab Content: Pedigree */}
          {specsSubTab === 'pedigree' && (
            <View style={styles.tabContentCard}>
              <AdvertPedigree
                pedigree={horse?.pedigree}
                horseName={horse?.registeredName || detail?.title}
                horseTjkNumber={horse?.tjkNumber}
                sireFallback={horse?.sire}
                damFallback={horse?.dam}
                damsireFallback={horse?.damsire}
              />
            </View>
          )}

          {/* Tab Content: Statistics */}
          {specsSubTab === 'statistics' && (
            <View style={styles.tabContentCard}>
              <AdvertStatistics
                statistics={horse?.statistics}
                handicap={horse?.handicap}
                handicapPoint={horse?.detailProfile?.handicapPoint}
                careerEarnings={horse?.detailProfile?.earning}
              />
            </View>
          )}

          {/* Tab Content: Siblings */}
          {specsSubTab === 'siblings' && (
            <View style={styles.tabContentCard}>
              <AdvertSiblings
                siblings={horse?.siblings}
                damName={horse?.dam}
              />
            </View>
          )}

          {/* Sekmeler değiştiğinde de Yorumlar (sol) ve Banner (sağ) 2 kolonlu sabit boyutunu korur */}
          {specsSubTab !== 'specs' && (
            <View style={[styles.hero, { marginTop: Spacing.lg }]}>
              <View style={styles.galleryCol}>
                <View
                  ref={reviewsAnchorRef}
                  collapsable={false}
                  nativeID="advert-reviews"
                  onLayout={(e) => {
                    sectionLayoutYRef.current['advert-reviews'] = e.nativeEvent.layout.y;
                  }}
                  style={Platform.select({
                    web: { scrollMarginTop: 90 } as any,
                    default: {},
                  })}
                >
                  <AdvertReviews detail={detail} accessToken={accessToken} />
                </View>
              </View>
              <View style={styles.buyCol}>
                <AdvertDetailBanner banner={detailBanners[0] ?? null} />
              </View>
            </View>
          )}

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

      <PublishToggleConfirmModal
        visible={isConfirmOpen}
        isPublished={isPublished}
        title={detail.title}
        loading={isTogglingPublish}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmTogglePublish}
      />

      <AdvertShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        detail={detail}
      />
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
  mobilePriceLocationWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mobileLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  mobileLocationText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  mobilePrice: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'right',
  },
  mobileSections: {
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  crumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 6,
  },
  desktopTopNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  desktopTopTabsCol: {
    flex: 1.15,
    minWidth: 0,
  },
  desktopTopActionsCol: {
    flex: 0.85,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  desktopTopCtaCall: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  desktopTopCtaWhatsApp: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  desktopTopFavBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  desktopTopShareBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  desktopTopCtaText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  desktopTopEditBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  desktopTopEditText: {
    fontSize: 14,
    fontWeight: '700',
  },
  desktopTopPublishBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  desktopTopPublishText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  subTabButtonText: {
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  subTabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  subTabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabContentCard: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  hero: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
    alignItems: 'flex-start',
  },
  galleryCol: { flex: 1.15, minWidth: 0, gap: Spacing.md },
  buyCol: { flex: 0.85, minWidth: 0, gap: Spacing.xl },
  lowerFull: {
    width: '100%',
    marginTop: Spacing.md,
    gap: Spacing.sm,
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
  unpublishedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    gap: 16,
  },
  unpublishedNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  unpublishedNoticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpublishedNoticeTextWrap: {
    flex: 1,
    gap: 2,
  },
  unpublishedNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f87171',
    letterSpacing: -0.2,
  },
  unpublishedNoticeSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  desktopTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.xl,
    marginTop: 0,
    marginBottom: Spacing.xs,
  },
  desktopTitleCol: {
    flex: 1.15,
    minWidth: 0,
    justifyContent: 'flex-start',
  },
  desktopTitleActionCol: {
    flex: 0.85,
    minWidth: 0,
  },
  rejectionReasonBanner: {
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rejectionReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rejectionReasonTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rejectionReasonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  unpublishedNoticeBannerMobile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  unpublishedNoticeTitleMobile: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#f87171',
  },
  unpublishedNoticeSubtitleMobile: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  bannerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bannerEditBtnMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  bannerEditBtnTextMobile: {
    fontSize: 12,
    fontWeight: '700',
  },
});
