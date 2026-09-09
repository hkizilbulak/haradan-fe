import React, { memo, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup } from '@/services/location';
import { Button } from '@/components/ui/Button';
import {
  AdvertBuyBox,
  AdvertGallery,
  AdvertPedigree,
  AdvertSiblings,
  AdvertStatistics,
  type SpecsSubTab,
} from '@/components/advert-detail';
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
    earning: '165.000 ₺',
  },
  {
    yearLabel: '2025',
    raceCount: '8',
    first: '3',
    second: '2',
    third: '1',
    fourth: '0',
    earning: '240.000 ₺',
  },
  {
    yearLabel: 'TOPLAM',
    raceCount: '14',
    first: '5',
    second: '3',
    third: '2',
    fourth: '1',
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
  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const skeleton = useThemeColor('skeleton');

  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTab>('specs');

  const detail = useMemo(() => mapDraftToAdvertDetail(draft), [draft]);

  const subTabs = useMemo(() => {
    const list: {
      key: SpecsSubTab;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      badge?: string;
    }[] = [];

    list.push({ key: 'specs', label: 'Genel Bilgiler', icon: 'information-circle-outline' });

    list.push({
      key: 'pedigree',
      label: 'Pedigri (Soyağacı)',
      icon: 'git-branch-outline',
    });

    list.push({
      key: 'statistics',
      label: 'İstatistikler',
      icon: 'bar-chart-outline',
    });

    const siblingCount = detail.horse?.siblings?.length ?? 0;
    list.push({
      key: 'siblings',
      label: 'Anne Kardeşleri',
      icon: 'people-outline',
      badge: siblingCount > 0 ? String(siblingCount) : undefined,
    });

    return list;
  }, [detail]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: bg, borderColor: border },
          ]}
        >
          {/* Modal Header Bar with Close Button */}
          <View style={[styles.topModalBar, { borderBottomColor: border, backgroundColor: surface }]}>
            <View style={styles.topModalBarLeft}>
              <View style={[styles.liveTag, { backgroundColor: primary }]}>
                <Ionicons name="eye" size={12} color="#ffffff" />
                <Text style={styles.liveTagText}>İLAN ÖNİZLEME</Text>
              </View>
              <Text style={[styles.topModalBarTitle, { color: textSecondary }]}>
                Yayınlandığında sitede alıcılara bu şekilde görünecektir
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={text} />
            </Pressable>
          </View>

          {/* Gerçek İlan Detay Görünümü Scroll Alanı */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Büyük İlan Başlığı (Ekran görüntüsündeki gibi: AÇELYA) */}
            <Text style={[styles.mainAdvertTitle, { color: text }]}>
              {detail.title.toUpperCase()}
            </Text>

            {/* 2. Sub Tabs & İlanı Düzenle Butonu (Ekran görüntüsündeki gibi) */}
            <View style={styles.desktopTopNavRow}>
              {/* Sol: Sekmeler */}
              <View style={styles.desktopTopTabsCol}>
                <View style={styles.subTabsContainer}>
                  {subTabs.map((t) => {
                    const isActive = t.key === specsSubTab;
                    const iconName = isActive
                      ? (t.key === 'specs' ? 'information-circle' : t.icon.replace('-outline', '') as any)
                      : t.icon;
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
                          name={iconName}
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
                                  : '#3b1219',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.subTabBadgeText,
                                { color: isActive ? '#ffffff' : '#ef4444' },
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

              {/* Sağ: İlanı Düzenle Butonu (Ekran görüntüsündeki sağ üst buton) */}
              <View style={styles.desktopTopActionsCol}>
                <Pressable
                  onPress={onEdit}
                  style={({ pressed }) => [
                    styles.desktopTopEditBtn,
                    { borderColor: border, backgroundColor: surface },
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityLabel="İlanı Düzenle"
                >
                  <Ionicons name="create-outline" size={17} color={text} />
                  <Text style={[styles.desktopTopEditText, { color: text }]}>
                    İlanı Düzenle
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 3. Hero 2 Kolonlu Alan (Sol: Galeri + Yorumlar, Sağ: BuyBox) */}
            {specsSubTab === 'specs' && (
              <View style={styles.hero}>
                {/* Sol Kolon: Galeri ve Yorumlar */}
                <View style={styles.galleryCol}>
                  {detail.gallery && detail.gallery.length > 0 ? (
                    <AdvertGallery
                      items={detail.gallery}
                      height={420}
                      accessToken={null}
                    />
                  ) : (
                    <View
                      style={[
                        styles.noGalleryBox,
                        { backgroundColor: skeleton, borderColor: border },
                      ]}
                    >
                      <Ionicons
                        name="images-outline"
                        size={54}
                        color={textMuted}
                      />
                      <Text style={[styles.noGalleryText, { color: textMuted }]}>
                        Fotoğraf yüklenmedi
                      </Text>
                      <Text style={[styles.noGallerySub, { color: textSecondary }]}>
                        Fotoğraflı ilanlar ortalama 5 kat daha fazla incelenir.
                      </Text>
                    </View>
                  )}

                  {/* Yorumlar Bölümü (Ekran görüntüsündeki sol alt alan) */}
                  <View style={styles.reviewsSection}>
                    <View style={styles.reviewsHeader}>
                      <Text style={[styles.reviewsTitle, { color: text }]}>
                        Yorumlar
                      </Text>
                      <View
                        style={[
                          styles.writeReviewBtn,
                          { borderColor: border, backgroundColor: surface },
                        ]}
                      >
                        <Ionicons
                          name="create-outline"
                          size={15}
                          color={text}
                        />
                        <Text
                          style={[styles.writeReviewBtnText, { color: text }]}
                        >
                          Yorum ve Puan Yaz
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.reviewsEmptyCard,
                        { backgroundColor: surface, borderColor: border },
                      ]}
                    >
                      <Ionicons
                        name="chatbubbles-outline"
                        size={32}
                        color={textMuted}
                      />
                      <Text
                        style={[styles.reviewsEmptyText, { color: textMuted }]}
                      >
                        Bu ilan için henüz yorum yapılmamış.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Sağ Kolon: Orijinal AdvertBuyBox (Ekran görüntüsündeki gibi) */}
                <View style={styles.buyCol}>
                  <AdvertBuyBox
                    detail={detail}
                    variant="default"
                    favorite={false}
                    isOwner={true}
                    onEdit={onEdit}
                  />
                </View>
              </View>
            )}

            {/* Tab: Pedigri (Soyağacı) */}
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

            {/* Tab: İstatistikler */}
            {specsSubTab === 'statistics' && (
              <View style={styles.tabContentCard}>
                <AdvertStatistics
                  statistics={detail.horse?.statistics}
                  handicap={detail.horse?.handicap}
                />
              </View>
            )}

            {/* Tab: Anne Kardeşleri */}
            {specsSubTab === 'siblings' && (
              <View style={styles.tabContentCard}>
                <AdvertSiblings
                  siblings={detail.horse?.siblings}
                  damName={detail.horse?.dam}
                />
              </View>
            )}
          </ScrollView>

          {/* Modal Sabit Alt Bar: Düzenle & Devam Et */}
          <View
            style={[
              styles.footer,
              { borderTopColor: border, backgroundColor: surface },
            ]}
          >
            <View style={styles.footerNoteWrap}>
              <Ionicons
                name="sparkles"
                size={16}
                color={primary}
              />
              <Text style={[styles.footerNoteText, { color: textSecondary }]}>
                İlanınız yayına alındığında ziyaretçilere birebir bu şekilde gösterilecektir.
              </Text>
            </View>
            <View style={styles.footerButtons}>
              <Button
                variant="primary"
                size="md"
                onPress={onContinue}
                accessibilityLabel="Devam Et"
              >
                Devam Et ›
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 1180,
    maxHeight: '94%',
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
      },
      default: {
        elevation: 16,
      },
    }),
  },
  topModalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topModalBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  topModalBarTitle: {
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.avatar,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  mainAdvertTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: 4,
  },
  desktopTopNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      web: { flexWrap: 'nowrap' },
      default: { flexWrap: 'wrap' },
    }),
  },
  desktopTopTabsCol: {
    flex: 1,
    minWidth: 260,
  },
  desktopTopActionsCol: {
    minWidth: 160,
    alignItems: 'flex-end',
  },
  desktopTopEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  desktopTopEditText: {
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
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
      },
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
  hero: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xs,
    alignItems: 'flex-start',
    ...Platform.select({
      web: { flexWrap: 'nowrap' },
      default: { flexWrap: 'wrap' },
    }),
  },
  galleryCol: {
    flex: 1.15,
    minWidth: 320,
    gap: Spacing.xl,
  },
  buyCol: {
    flex: 0.85,
    minWidth: 320,
  },
  noGalleryBox: {
    height: 420,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: Spacing.lg,
  },
  noGalleryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  noGallerySub: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
  reviewsSection: {
    gap: 12,
    marginTop: Spacing.sm,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  writeReviewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  reviewsEmptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewsEmptyText: {
    fontSize: 13,
  },
  tabContentCard: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    ...Platform.select({
      web: { flexWrap: 'nowrap' },
      default: { flexWrap: 'wrap' },
    }),
  },
  footerNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footerNoteText: {
    fontSize: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
