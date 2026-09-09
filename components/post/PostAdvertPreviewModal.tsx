import React, { memo, useMemo, useState } from 'react';
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
  AdvertSpecs,
  type SpecsSubTab,
} from '@/components/advert-detail';
import { formatMoney } from '@/utils/formatMoney';
import type {
  AdvertDetail,
  AdvertSpecGroup,
  HorseGender,
  HorseProfile,
  HorseSibling,
  HorseStatistic,
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

function buildSpecsFromDraft(draft: ListingDraft): AdvertSpecGroup[] {
  const d = draft.details;
  const rows: { label: string; value: string }[] = [];

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

  if (d.facilityGrassPaddock != null)
    rows.push({ label: 'Çim Padok', value: d.facilityGrassPaddock ? 'Var' : 'Yok' });
  if (d.facilitySandPaddock != null)
    rows.push({ label: 'Kum Padok', value: d.facilitySandPaddock ? 'Var' : 'Yok' });
  if (d.facilityVeterinarian != null)
    rows.push({ label: 'Veteriner Hizmeti', value: d.facilityVeterinarian ? 'Var' : 'Yok' });
  if (d.facilityFarrier != null)
    rows.push({ label: 'Nalbant Hizmeti', value: d.facilityFarrier ? 'Var' : 'Yok' });

  if (d.properties) {
    for (const [k, v] of Object.entries(d.properties)) {
      if (
        v != null &&
        v !== '' &&
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

const SAMPLE_GALLERY: PublicMediaItem[] = [
  {
    assetId: 'sample-horse-1',
    displayOrder: 0,
    isCover: true,
    publicUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80',
    usage: 'cover',
  },
  {
    assetId: 'sample-horse-2',
    displayOrder: 1,
    isCover: false,
    publicUrl: 'https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&w=600&q=80',
    usage: 'gallery',
  },
  {
    assetId: 'sample-horse-3',
    displayOrder: 2,
    isCover: false,
    publicUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80',
    usage: 'gallery',
  },
];

const SAMPLE_SIBLINGS: HorseSibling[] = [
  {
    name: 'GÖKÇE EFE',
    fatherName: 'KAFKAS ŞAHI',
    raceCount: '24',
    first: '5',
    second: '3',
    third: '4',
    fourth: '2',
    earning: '420.500 ₺',
  },
  {
    name: 'RÜZGARIN SESİ',
    fatherName: 'TURBO',
    raceCount: '18',
    first: '4',
    second: '2',
    third: '1',
    fourth: '3',
    earning: '315.000 ₺',
  },
  {
    name: 'ASİL KIZ',
    fatherName: 'ÖZGÜNHAN',
    raceCount: '12',
    first: '2',
    second: '3',
    third: '2',
    fourth: '1',
    earning: '185.000 ₺',
  },
];

const SAMPLE_STATISTICS: HorseStatistic[] = [
  {
    yearLabel: '2026',
    raceCount: '6',
    first: '2',
    second: '1',
    third: '1',
    fourth: '1',
    fifth: '0',
    earning: '165.000 ₺',
  },
  {
    yearLabel: '2025',
    raceCount: '8',
    first: '3',
    second: '2',
    third: '1',
    fourth: '0',
    fifth: '1',
    earning: '240.000 ₺',
  },
  {
    yearLabel: 'TOPLAM',
    raceCount: '14',
    first: '5',
    second: '3',
    third: '2',
    fourth: '1',
    fifth: '1',
    earning: '405.000 ₺',
  },
];

function mapDraftToAdvertDetail(draft: ListingDraft): AdvertDetail {
  const d = draft.details;
  const title = (d.registeredName || d.title || '').trim() || 'AÇELYA';
  const description = d.description || '';

  const priceNum = parseFloat(
    (d.priceTl || '').replace(/\./g, '').replace(',', '.')
  );
  const price: Money | null =
    !isNaN(priceNum) && priceNum > 0
      ? { amountMinor: Math.round(priceNum * 100), currency: 'TRY' }
      : { amountMinor: 300000000, currency: 'TRY' };

  const districtId = d.districtId || '';
  const provinceId = d.provinceId || '';
  const locationName =
    locationLookup.formatLocation(districtId, provinceId) || 'Çankaya, Ankara';

  const categoryName = draft.type?.categoryName || 'Satılık Yarış Atı';
  const categoryId = draft.type?.categoryId || 'c1000000-0000-4000-8000-000000000011';

  const userMedia: PublicMediaItem[] = (draft.media ?? []).map((m, idx) => ({
    assetId: m.localId || String(idx),
    displayOrder: idx,
    isCover: Boolean(m.isCover),
    publicUrl: m.uri,
    usage: m.isCover ? 'cover' : 'gallery',
  }));

  const gallery = userMedia.length > 0 ? userMedia : SAMPLE_GALLERY;
  const cover = gallery.find((m) => m.isCover) ?? gallery[0] ?? null;

  const parseGender = (g?: string | null): HorseGender => {
    if (!g) return 'Dişi' as HorseGender;
    const lower = g.toLowerCase();
    if (lower === 'mare' || lower === 'kısrak' || lower === 'dişi' || lower === 'disi') return 'Dişi' as HorseGender;
    if (lower === 'stallion' || lower === 'aygır' || lower === 'erkek') return 'Erkek' as HorseGender;
    if (lower === 'gelding' || lower === 'iğdiş' || lower === 'igdis') return 'İğdiş' as HorseGender;
    return g as HorseGender;
  };

  const rawSiblings: HorseSibling[] =
    (d as any).siblings && Array.isArray((d as any).siblings) && (d as any).siblings.length > 0
      ? (d as any).siblings
      : SAMPLE_SIBLINGS;

  const rawStatistics: HorseStatistic[] =
    (d as any).statistics && Array.isArray((d as any).statistics) && (d as any).statistics.length > 0
      ? (d as any).statistics
      : SAMPLE_STATISTICS;

  const horse: HorseProfile = {
    registeredName: d.registeredName || title,
    tjkNumber: d.tjkNumber || '43',
    breed: d.breed || 'İngiliz (Thoroughbred)',
    gender: parseGender(d.gender),
    age: d.age ? (String(d.age).includes('yaş') ? d.age : `${d.age} Yaş üzeri`) : '15 Yaş üzeri',
    birthDate: d.birthDate || '',
    coatColor: d.coatColor || 'Doru',
    heightCm: d.heightCm ? Number(d.heightCm) : null,
    sire: d.sire || 'SHINING STEEL (GB)',
    dam: d.dam || 'SÜRSÜRÜ',
    damsire: d.damsire || 'BACHELOR PARTY',
    owners: d.ownersText ? [d.ownersText] : [],
    breeder: d.breeder || '',
    trainer: d.trainer || '',
    career: { starts: 14, first: 5, second: 3, third: 2, fourth: 1, fifth: 0 },
    yearly: [],
    careerEarnings: { amountMinor: 40500000, currency: 'TRY' },
    handicap: 68,
    races: [],
    offspring: null,
    pedigree: [],
    siblings: rawSiblings,
    statistics: rawStatistics,
  };

  const propMap: Record<string, unknown> = {
    ...(d.properties ?? {}),
    REGISTERED_NAME: d.registeredName || 'AÇELYA',
    tjkNumber: d.tjkNumber || '43',
    HORSE_NAME: d.registeredName || 'AÇELYA',
    HORSE_BREED: d.breed || 'İngiliz (Thoroughbred)',
    HORSE_GENDER: d.gender || 'Dişi',
    HORSE_AGE: d.age || '15 Yaş üzeri',
    BIRTH_DATE: d.birthDate,
    COAT_COLOR: d.coatColor || 'Doru',
    HEIGHT_CM: d.heightCm,
    SIRE: d.sire || 'SHINING STEEL (GB)',
    DAM: d.dam || 'SÜRSÜRÜ',
    DAMSIRE: d.damsire || 'BACHELOR PARTY',
    BREEDER: d.breeder,
    TRAINER: d.trainer,
    sellerPhone: d.sellerPhone,
    inTraining: d.inTraining != null ? d.inTraining : true,
    isRaceReady: d.isRaceReady != null ? d.isRaceReady : true,
    isForRent: d.isForRent != null ? d.isForRent : false,
    idmandami: d.inTraining != null ? d.inTraining : true,
    kosardurumdami: d.isRaceReady != null ? d.isRaceReady : true,
    kiralikmi: d.isForRent != null ? d.isForRent : false,
  };

  return {
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
    horseId: null,
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
    breadcrumbs: [
      { label: 'Ana sayfa', href: '/' },
      { label: categoryName, href: '#' },
      { label: title },
    ],
    horse,
    specs: buildSpecsFromDraft(draft),
    properties: propMap,
    rawProperties: propMap,
    slug: String(draft.advertId ?? '43'),
    rating: 0,
    reviewCount: 0,
    oldPrice: null,
    brand: null,
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
              <Text style={[styles.wideTitle, { color: text }]}>
                {detail.title.toUpperCase()}
              </Text>

              <View style={styles.wideHero}>
                {/* Sol: Galeri */}
                <View style={styles.wideGalleryCol}>
                  <AdvertGallery items={detail.gallery} height={galleryHeight} accessToken={null} />
                </View>
                {/* Sağ: BuyBox */}
                <View style={styles.wideBuyCol}>
                  <AdvertBuyBox detail={detail} variant="default" favorite={false} isOwner onEdit={onEdit} />
                </View>
              </View>

              <View style={styles.wideSpecsWrap}>
                <AdvertSpecs
                  groups={detail.specs}
                  horse={detail.horse}
                  detail={detail}
                  activeSubTab={specsSubTab}
                  onSubTabChange={setSpecsSubTab}
                />
              </View>
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
          {/* Mobil Header — gerçek sayfadaki gibi geri + başlık + düzenle */}
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

            {/* AdvertSpecs sekmeli bölümü */}
            <View style={styles.mobileSpecsWrap}>
              <AdvertSpecs
                groups={detail.specs}
                horse={detail.horse}
                detail={detail}
                activeSubTab={specsSubTab}
                onSubTabChange={setSpecsSubTab}
              />
            </View>
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
  editBtn: { padding: 6 },
  editAction: { fontSize: 14, fontWeight: '600' },
  /* Scroll */
  scroll: { flex: 1 },
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
  mobileBuyBox: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  mobileSpecsWrap: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xl,
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
  wideSpecsWrap: { marginTop: Spacing.sm },
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
