import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup, useAdvertLocation } from '@/services/location';
import { Button } from '@/components/ui/Button';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import {
  AdvertBuyBox,
  AdvertGallery,
  AdvertPedigree,
  AdvertSiblings,
  AdvertSpecs,
  AdvertStatistics,
  type SpecsSubTab,
} from '@/components/advert-detail';
import { getAdvertCategoryKind } from '@/components/advert-detail/advertCategoryHelper';
import { formatMoney } from '@/utils/formatMoney';
import { buildDraftProperties } from '@/services/listing/mapDraftToRequest';
import {
  isFarrierListing,
  isHorseListing,
  isPansiyonListing,
  isSaleHorseListing,
  isStudServiceListing,
  isTransportListing,
} from '@/services/listing';
import type {
  AdvertDetail,
  AdvertSpecGroup,
  HorseGender,
  HorseProfile,
  Money,
  PublicMediaItem,
} from '@/types';
import type { ListingDraft } from '@/types/listing';

type PostAdvertPreviewModalProps = {
  visible: boolean;
  draft: ListingDraft;
  onClose: () => void;
  onEdit: () => void;
  onContinue: () => void;
};

const EMPTY_HORSE: HorseProfile = {
  registeredName: '',
  age: 0,
  birthDate: '',
  gender: '' as HorseGender,
  coatColor: '',
  heightCm: null,
  breed: '',
  sire: '',
  dam: '',
  damsire: '',
  owners: [],
  breeder: '',
  trainer: '',
  career: { starts: 0, first: 0, second: 0, third: 0, fourth: 0, fifth: 0 },
  yearly: [],
  careerEarnings: { amountMinor: 0, currency: 'TRY' },
  handicap: 0,
  races: [],
  offspring: null,
  pedigree: [],
  siblings: [],
  statistics: [],
};

const SAMPLE_FACILITY_GALLERY: PublicMediaItem[] = [
  {
    assetId: 'sample-facility-1',
    displayOrder: 0,
    isCover: true,
    publicUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    usage: 'cover',
  },
];

const SAMPLE_HORSE_GALLERY: PublicMediaItem[] = [
  {
    assetId: 'sample-horse-1',
    displayOrder: 0,
    isCover: true,
    publicUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80',
    usage: 'cover',
  },
];

function buildSpecsFromDraft(draft: ListingDraft): AdvertSpecGroup[] {
  const d = draft.details;
  const rows: { label: string; value: string }[] = [];

  const isPansiyon = isPansiyonListing(draft.type);
  const isTransport = isTransportListing(draft.type);
  const isStud = isStudServiceListing(draft.type);
  const isHorse = isHorseListing(draft.type) || isSaleHorseListing(draft.type);

  if (isPansiyon) {
    if (d.facilityGrassPaddock != null)
      rows.push({ label: 'Çim Padok', value: d.facilityGrassPaddock ? 'Evet' : 'Hayır' });
    if (d.facilitySandPaddock != null)
      rows.push({ label: 'Kum Padok', value: d.facilitySandPaddock ? 'Evet' : 'Hayır' });
    if (d.facilityStallionPaddock != null)
      rows.push({ label: 'Aygır Padoğu', value: d.facilityStallionPaddock ? 'Evet' : 'Hayır' });
    if (d.facilityFoalingBarn != null)
      rows.push({ label: 'Doğumhane', value: d.facilityFoalingBarn ? 'Evet' : 'Hayır' });
    if (d.facilityFarrier != null)
      rows.push({ label: 'Nalbant', value: d.facilityFarrier ? 'Evet' : 'Hayır' });
    if (d.facilityVeterinarian != null)
      rows.push({ label: 'Veteriner Hekim', value: d.facilityVeterinarian ? 'Evet' : 'Hayır' });
    if (d.facilityTrainingTrack != null)
      rows.push({ label: 'İdman Pisti', value: d.facilityTrainingTrack ? 'Evet' : 'Hayır' });
  } else if (isTransport) {
    if (d.companyName) rows.push({ label: 'Firma Adı', value: d.companyName });
    if (d.websiteUrl) rows.push({ label: 'Web Sitesi', value: d.websiteUrl });
  } else if (isStud) {
    if (d.studHorseName || d.registeredName) rows.push({ label: 'Aygır Adı', value: d.studHorseName || d.registeredName });
    if (d.studBreed || d.breed) rows.push({ label: 'At Irkı', value: d.studBreed || d.breed });
    if (d.studAge || d.age) rows.push({ label: 'Yaş', value: String(d.studAge || d.age) });
    rows.push({ label: 'Cinsiyet', value: 'Erkek' });
    if (d.studCoatColor || d.coatColor) rows.push({ label: 'Donu', value: d.studCoatColor || d.coatColor });
    if (d.studSire || d.sire) rows.push({ label: 'Baba Adı', value: d.studSire || d.sire });
    if (d.studDam || d.dam) rows.push({ label: 'Anne Adı', value: d.studDam || d.dam });
    if (d.studDamsire || d.damsire) rows.push({ label: 'Annesinin Baba Adı', value: d.studDamsire || d.damsire || '' });
  } else if (isHorse) {
    if (d.registeredName) rows.push({ label: 'At Adı', value: d.registeredName });
    if (d.tjkNumber) rows.push({ label: 'TJK No', value: d.tjkNumber });
    if (d.breed) rows.push({ label: 'Irk', value: d.breed });
    if (d.gender) {
      const gMap: Record<string, string> = {
        STALLION: 'Aygır',
        MARE: 'Kısrak',
        GELDING: 'İğdiş',
        COLT: 'Erkek Tay',
        FILLY: 'Dişi Tay',
      };
      rows.push({ label: 'Cinsiyet', value: gMap[d.gender] || d.gender });
    }
    if (d.age) rows.push({ label: 'Yaş', value: `${d.age} Yaşında` });
    if (d.birthDate) rows.push({ label: 'Doğum Tarihi', value: d.birthDate });
    if (d.coatColor) rows.push({ label: 'Don (Renk)', value: d.coatColor });
    if (d.heightCm) rows.push({ label: 'Cidago (Boy)', value: `${d.heightCm} cm` });
    if (d.sire) rows.push({ label: 'Baba (Sire)', value: d.sire });
    if (d.dam) rows.push({ label: 'Anne (Dam)', value: d.dam });
    if (d.damsire) rows.push({ label: 'Anne Babası', value: d.damsire });
    if (d.breeder) rows.push({ label: 'Yetiştirici', value: d.breeder });
    if (d.trainer) rows.push({ label: 'Antrenör', value: d.trainer });
    if (d.ownersText) rows.push({ label: 'Sahip / İlgililer', value: d.ownersText });
    if (d.inTraining != null) rows.push({ label: 'İdmanda mı', value: d.inTraining ? 'Evet' : 'Hayır' });
    if (d.isRaceReady != null) rows.push({ label: 'Koşar durumda mı', value: d.isRaceReady ? 'Evet' : 'Hayır' });
    if (d.isForRent != null) rows.push({ label: 'Kiralık mı', value: d.isForRent ? 'Evet' : 'Hayır' });
    if (d.isPregnant != null) rows.push({ label: 'Gebe mi', value: d.isPregnant ? 'Evet' : 'Hayır' });
    if (d.coveringStallion) rows.push({ label: 'Gebe Olduğu Aygır', value: d.coveringStallion });
    if (d.pregnancyStage) rows.push({ label: 'Gebelik Durumu', value: d.pregnancyStage });
    if (d.lastCoveringDate) rows.push({ label: 'Son Aşım Tarihi', value: d.lastCoveringDate });
  }

  // Dinamik kategori özellikleri
  if (d.properties) {
    for (const [k, v] of Object.entries(d.properties)) {
      if (
        v != null &&
        v !== '' &&
        v !== 'null' &&
        v !== 'undefined' &&
        k !== 'sellerPhone' &&
        k !== 'phone' &&
        !rows.some((r) => r.label.toLowerCase() === k.toLowerCase())
      ) {
        rows.push({
          label: k,
          value: typeof v === 'boolean' ? (v ? 'Evet' : 'Hayır') : String(v),
        });
      }
    }
  }

  return rows.length ? [{ id: 'props', title: 'Genel Bilgiler', rows }] : [];
}

function mapDraftToAdvertDetail(draft: ListingDraft): AdvertDetail {
  const d = draft.details;
  const isPansiyon = isPansiyonListing(draft.type);
  const isTransport = isTransportListing(draft.type);
  const isFarrier = isFarrierListing(draft.type);
  const isStud = isStudServiceListing(draft.type);
  const isHorse = isHorseListing(draft.type) || isSaleHorseListing(draft.type);
  const isService =
    isPansiyon ||
    isTransport ||
    isFarrier ||
    draft.type?.parentSlug === 'at-hizmetleri' ||
    draft.type?.categorySlug === 'at-hizmetleri' ||
    Boolean(draft.type?.categoryName?.toLowerCase().includes('hizmet')) ||
    draft.type?.categoryId === 'c1000000-0000-4000-8000-000000000002';

  const title = (d.title || d.registeredName || d.studHorseName || '').trim() || 'İlan Başlığı';
  const description = d.description || '';

  const priceNum = parseFloat(
    (d.priceTl || '').replace(/\./g, '').replace(',', '.')
  );
  const price: Money | null =
    !isNaN(priceNum) && priceNum > 0
      ? { amountMinor: Math.round(priceNum * 100), currency: 'TRY' }
      : null;

  const districtId = d.districtId || '';
  const provinceId = d.provinceId || '';
  const locationName =
    locationLookup.formatLocation(districtId, provinceId) || 'Konum Belirtilmedi';

  const categoryName = draft.type?.categoryName || (isService ? 'At Hizmetleri' : 'Satılık Yarış Atı');
  const categoryId = draft.type?.categoryId || (isService ? 'c1000000-0000-4000-8000-000000000002' : 'c1000000-0000-4000-8000-000000000011');
  const categorySlug = draft.type?.categorySlug || (isService ? 'at-hizmetleri' : 'satilik-yaris-ati');
  const parentSlug = draft.type?.parentSlug || null;

  const userMedia: PublicMediaItem[] = (draft.media ?? []).map((m, idx) => ({
    assetId: m.localId || String(idx),
    displayOrder: idx,
    isCover: Boolean(m.isCover),
    publicUrl: m.uri,
    usage: m.isCover ? 'cover' : 'gallery',
  }));

  const sampleFallback = isService ? SAMPLE_FACILITY_GALLERY : SAMPLE_HORSE_GALLERY;
  const gallery = userMedia.length > 0 ? userMedia : sampleFallback;
  const cover = gallery.find((m) => m.isCover) ?? gallery[0] ?? null;

  const parseGender = (g?: string | null): HorseGender => {
    if (!g) return 'Dişi' as HorseGender;
    const lower = g.toLowerCase();
    if (lower === 'mare' || lower === 'kısrak' || lower === 'dişi' || lower === 'disi') return 'Dişi' as HorseGender;
    if (lower === 'stallion' || lower === 'aygır' || lower === 'erkek') return 'Erkek' as HorseGender;
    if (lower === 'gelding' || lower === 'iğdiş' || lower === 'igdis') return 'İğdiş' as HorseGender;
    return g as HorseGender;
  };

  const horse: HorseProfile = (isService || (!isHorse && !isStud))
    ? { ...EMPTY_HORSE }
    : {
        ...EMPTY_HORSE,
        registeredName: d.registeredName || d.studHorseName || title,
        tjkNumber: d.tjkNumber || '',
        breed: d.breed || d.studBreed || '',
        gender: isStud ? ('Erkek' as HorseGender) : parseGender(d.gender),
        age: d.age || d.studAge || '',
        birthDate: d.birthDate || '',
        coatColor: d.coatColor || d.studCoatColor || '',
        heightCm: d.heightCm ? Number(d.heightCm) : null,
        sire: d.sire || d.studSire || '',
        dam: d.dam || d.studDam || '',
        damsire: d.damsire || d.studDamsire || '',
        owners: d.ownersText ? [d.ownersText] : [],
        breeder: d.breeder || '',
        trainer: d.trainer || '',
        career: (d as any).career || { starts: 0, first: 0, second: 0, third: 0, fourth: 0, fifth: 0 },
        yearly: (d as any).yearly || [],
        careerEarnings: (d as any).careerEarnings || { amountMinor: 0, currency: 'TRY' },
        handicap: (d as any).handicap || 0,
        races: (d as any).races || [],
        offspring: null,
        pedigree: (d as any).pedigree && Array.isArray((d as any).pedigree) ? (d as any).pedigree : [],
        siblings: (d as any).siblings && Array.isArray((d as any).siblings) ? (d as any).siblings : [],
        statistics: (d as any).statistics && Array.isArray((d as any).statistics) ? (d as any).statistics : [],
      };

  const propMap = buildDraftProperties(draft);
  if (isStud) {
    (propMap as any)['__isStud'] = true;
  }

  const breadcrumbs = [
    { label: 'Ana sayfa', href: '/' },
    ...(parentSlug && parentSlug !== categorySlug
      ? [{
          label:
            parentSlug === 'at-hizmetleri'
              ? 'At Hizmetleri'
              : parentSlug === 'satilik-atlar'
                ? 'Satılık Atlar'
                : parentSlug === 'asim-hizmetleri'
                  ? 'Aşım Hizmetleri'
                  : parentSlug,
          href: '#',
        }]
      : []),
    { label: categoryName, href: '#' },
    { label: title },
  ];

  const advertDetail: AdvertDetail = {
    id: draft.advertId ?? 43,
    title,
    description,
    publishedAt: new Date().toISOString(),
    price,
    categoryId,
    districtId,
    provinceId,
    provinceName: null,
    districtName: null,
    locationName,
    horseId: d.horseId ?? null,
    cover,
    gallery,
    isFavorite: false,
    packageCode: draft.packageCode ?? null,
    packageDisplayName: null,
    packageBadgeText: null,
    isUrgent: false,
    urgentActivatedAt: null,
    sellerId: null,
    sellerPhone: d.sellerPhone || null,
    viewCount: 0,
    breadcrumbs,
    horse,
    specs: buildSpecsFromDraft(draft),
    properties: propMap,
    rawProperties: propMap,
    slug: String(draft.advertId ?? '43'),
    rating: 0,
    reviewCount: 0,
    oldPrice: null,
    brand: isTransport ? (d.companyName || null) : null,
    available: true,
    shipping: [],
    warranties: [],
    bundleTitle: '',
    bundleItems: [],
    reviews: [],
    ratingBreakdown: [],
    viewed: [],
    related: [],
  };
  (advertDetail as any).category = { id: categoryId, name: categoryName, slug: categorySlug };

  return advertDetail;
}

export const PostAdvertPreviewModal = memo(function PostAdvertPreviewModal({
  visible,
  draft,
  onClose,
  onEdit,
  onContinue,
}: PostAdvertPreviewModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= HOME_DESKTOP_BREAKPOINT;

  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');

  const detail = useMemo(() => mapDraftToAdvertDetail(draft), [draft]);
  const location = useAdvertLocation(detail);
  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTab>('specs');

  const categoryKind = useMemo(() => getAdvertCategoryKind(detail), [detail]);
  const isHorseOrStud = categoryKind === 'horse' || categoryKind === 'stud';

  const subTabs = useMemo(() => {
    const list: {
      key: SpecsSubTab;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      badge?: string;
    }[] = [];

    list.push({ key: 'specs', label: 'Genel Bilgiler', icon: 'information-circle-outline' });

    // Pedigri, İstatistikler ve Anne Kardeşleri sadece At veya Aşım kategorilerinde ve veri varsa gösterilir
    if (
      isHorseOrStud &&
      ((detail.horse?.pedigree && detail.horse.pedigree.length > 0) ||
        Boolean(detail.horse?.sire || detail.horse?.dam))
    ) {
      list.push({ key: 'pedigree', label: 'Pedigri (Soyağacı)', icon: 'git-branch-outline' });
    }
    if (isHorseOrStud && detail.horse?.statistics && detail.horse.statistics.length > 0) {
      list.push({ key: 'statistics', label: 'İstatistikler', icon: 'stats-chart-outline' });
    }
    if (isHorseOrStud && detail.horse?.siblings && detail.horse.siblings.length > 0) {
      list.push({
        key: 'siblings',
        label: 'Anne Kardeşleri',
        icon: 'people-outline',
        badge: String(detail.horse.siblings.length),
      });
    }
    return list;
  }, [isHorseOrStud, detail.horse]);

  // Alt sekmeler değiştiğinde specs'e geri dön (örneğin kategori değiştiğinde)
  useEffect(() => {
    if (!subTabs.some((t) => t.key === specsSubTab)) {
      setSpecsSubTab('specs');
    }
  }, [subTabs, specsSubTab]);

  const galleryHeight = isWide ? 420 : 300;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {isWide ? (
        /* ═══ DESKTOP: overlay + centered card ═══ */
        <View style={styles.overlayWide}>
          <View style={[styles.wideCard, { backgroundColor: bg, borderColor: border }]}>
            {/* Desktop Header */}
            <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.liveTag, { backgroundColor: primary }]}>
                  <Ionicons name="eye" size={11} color="#fff" />
                  <Text style={styles.liveTagText}>ÖNİZLEME</Text>
                </View>
                <Text style={[styles.headerHint, { color: textMuted }]}>
                  Alıcılar bu şekilde görecek
                </Text>
              </View>
              <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: border }]}>
                <Ionicons name="close" size={20} color={text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.wideScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Ekmek kırıntısı (Breadcrumbs) — yayındaki ilan sayfasıyla birebir */}
              <View style={styles.crumbs}>
                {detail.breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={`${crumb.label}-${i}`}>
                    {i > 0 ? (
                      <Text style={{ color: textMuted, fontSize: 12 }}> › </Text>
                    ) : null}
                    <Text
                      style={{
                        color: i === detail.breadcrumbs.length - 1 ? text : textMuted,
                        fontSize: 12.5,
                        fontWeight: i === detail.breadcrumbs.length - 1 ? '600' : '400',
                      }}
                    >
                      {crumb.label}
                    </Text>
                  </React.Fragment>
                ))}
              </View>

              <Text style={[styles.wideTitle, { color: text }]}>
                {detail.title}
              </Text>

              {/* Sub Tabs Bar (Sadece birden fazla sekme olduğunda gösterilir) */}
              {subTabs.length > 1 ? (
                <View style={styles.desktopSubTabsWrap}>
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
              ) : null}

              {/* Tab Content: Genel Bilgiler */}
              {specsSubTab === 'specs' && (
                <View style={styles.wideHero}>
                  {/* Sol: Galeri */}
                  <View style={styles.wideGalleryCol}>
                    <AdvertGallery items={detail.gallery} height={galleryHeight} accessToken={null} />
                  </View>
                  {/* Sağ: BuyBox (Kategoriye özel tablo + Fiyat + Konum + Açıklama) */}
                  <View style={styles.wideBuyCol}>
                    <AdvertBuyBox detail={detail} variant="default" favorite={false} isOwner onEdit={onEdit} />
                  </View>
                </View>
              )}

              {/* Tab Content: Pedigri */}
              {specsSubTab === 'pedigree' && (
                <View style={styles.tabContentCard}>
                  <AdvertPedigree
                    pedigree={detail.horse?.pedigree}
                    horseName={detail.horse?.registeredName || detail.title}
                    sireFallback={detail.horse?.sire}
                    damFallback={detail.horse?.dam}
                    damsireFallback={detail.horse?.damsire}
                  />
                </View>
              )}

              {/* Tab Content: İstatistikler */}
              {specsSubTab === 'statistics' && (
                <View style={styles.tabContentCard}>
                  <AdvertStatistics
                    statistics={detail.horse?.statistics}
                    handicap={detail.horse?.handicap}
                    handicapPoint={detail.horse?.detailProfile?.handicapPoint}
                    careerEarnings={detail.horse?.detailProfile?.earning}
                  />
                </View>
              )}

              {/* Tab Content: Anne Kardeşleri */}
              {specsSubTab === 'siblings' && (
                <View style={styles.tabContentCard}>
                  <AdvertSiblings
                    siblings={detail.horse?.siblings}
                    damName={detail.horse?.dam}
                  />
                </View>
              )}
            </ScrollView>

            {/* Desktop Footer */}
            <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border }]}>
              <View style={styles.footerHint}>
                <Ionicons name="sparkles" size={14} color={primary} />
                <Text style={[styles.footerHintText, { color: textSecondary }]}>
                  Alıcılara birebir bu şekilde gösterilecek
                </Text>
              </View>
              <View style={styles.footerButtons}>
                <Button variant="secondary" size="md" onPress={onEdit}>Düzenle</Button>
                <Button variant="primary" size="md" onPress={onContinue}>Devam Et ›</Button>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* ═══ MOBİL: Gerçek ilan sayfasıyla birebir tam ekran ═══ */
        <View style={[styles.container, { backgroundColor: bg }]}>
          {/* Mobil Header — geri + başlık */}
          <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={text} />
            </Pressable>
            <View style={styles.headerCenter}>
              <View style={[styles.liveTag, { backgroundColor: primary }]}>
                <Ionicons name="eye" size={10} color="#fff" />
                <Text style={styles.liveTagText}>ÖNİZLEME</Text>
              </View>
            </View>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* 1. Full-bleed galeri — gerçek sayfa gibi */}
            <View style={styles.mobileGalleryWrap}>
              <AdvertGallery
                items={detail.gallery}
                height={galleryHeight}
                fullBleed
                accessToken={null}
              />
            </View>

            {/* 2. Başlık + Konum / Fiyat satırı */}
            <View style={styles.mobileSummary}>
              <Text style={[styles.mobileTitle, { color: text }]}>{detail.title}</Text>
              <View style={styles.mobilePriceRow}>
                <View style={styles.mobileLocationRow}>
                  {location && location !== '-' && location.trim() !== '' ? (
                    <>
                      <Ionicons name="location-outline" size={13} color={primary} />
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

            {/* 3. AdvertSpecs (Kategoriye özel özellikler listesi) */}
            <View style={styles.mobileSpecsWrap}>
              <AdvertSpecs
                groups={detail.specs}
                horse={detail.horse}
                detail={detail}
                activeSubTab={specsSubTab}
                onSubTabChange={setSpecsSubTab}
              />
            </View>

            {/* 4. İlan Açıklaması (Mobilde özelliklerin altında) */}
            {detail.description ? (
              <View style={styles.mobileDescWrap}>
                <View style={[styles.mobileDescCard, { backgroundColor: surface, borderColor: border }]}>
                  <View style={styles.descHeader}>
                    <Ionicons name="document-text-outline" size={16} color={textMuted} />
                    <Text style={[styles.blockLabel, { color: text }]}>
                      İlan Açıklaması
                    </Text>
                  </View>
                  {Platform.OS === 'web' ? (
                    <div
                      style={{
                        color: textSecondary,
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{ __html: detail.description }}
                    />
                  ) : (
                    <Text style={[styles.desc, { color: textSecondary }]}>
                      {detail.description.replace(/<[^>]+>/g, '')}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Sabit Alt Bar */}
          <View style={[styles.footer, { backgroundColor: surface, borderTopColor: border }]}>
            <Button variant="secondary" size="md" onPress={onEdit} style={styles.footerSecBtn}>
              Düzenle
            </Button>
            <Button variant="primary" size="md" onPress={onContinue} style={styles.footerPriBtn}>
              Devam Et ›
            </Button>
          </View>
        </View>
      )}
    </Modal>
  );
});

const styles = StyleSheet.create({
  /* Overlay (desktop) */
  overlayWide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  wideCard: {
    width: '100%',
    maxWidth: 1180,
    maxHeight: '92%',
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 24px 64px rgba(0,0,0,0.5)' } as any,
      default: { elevation: 20 },
    }),
  },
  /* Shared container (mobile full-screen) */
  container: { flex: 1 },
  /* Shared header */
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerHint: { fontSize: 12, flexShrink: 1 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { padding: 6 },
  /* Scroll */
  scroll: { flex: 1 },
  crumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: -Spacing.xs,
  },
  /* Mobile layout */
  mobileGalleryWrap: { width: '100%' },
  mobileSummary: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  mobileTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  mobilePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  mobileLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  mobileLocationText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  mobilePrice: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  mobileSpecsWrap: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  mobileDescWrap: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  mobileDescCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: '400',
  },
  /* Desktop layout */
  wideScrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  wideTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  wideHero: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'flex-start',
  },
  wideGalleryCol: { flex: 1.15, minWidth: 0 },
  wideBuyCol: { flex: 0.85, minWidth: 0 },
  desktopSubTabsWrap: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  footerHintText: { fontSize: 12, flexShrink: 1 },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerSecBtn: { flexShrink: 1 },
  footerPriBtn: { flexShrink: 1 },
});
