import React, { memo } from 'react';
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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup } from '@/services/location';
import { formatMoney } from '@/utils/formatMoney';
import { Button } from '@/components/ui/Button';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import type { ListingDraft, ListingPackage, ListingPackageCode } from '@/types/listing';

type PackagePreviewModalProps = {
  visible: boolean;
  pkg: ListingPackage | null;
  draft: ListingDraft;
  onClose: () => void;
  onSelectPackage: (code: ListingPackageCode) => void;
};

const URGENT_RED = '#e11d48';
const GOLD_AMBER = '#d97706';
const FEATURED_BLUE = '#2563eb';
const SUCCESS_GREEN = '#10b981';

type CardPreviewProps = {
  coverUri: string | null;
  categoryName: string;
  displayTitle: string;
  displayPrice: string;
  location: string;
  badgeType?: 'urgent' | 'showcase' | 'featured' | null;
  badgeLabel?: string;
  isUnlocked?: boolean;
};

function PreviewAdvertCard({
  coverUri,
  categoryName,
  displayTitle,
  displayPrice,
  location,
  badgeType,
  badgeLabel,
  isUnlocked = true,
}: CardPreviewProps) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const skeleton = useThemeColor('skeleton');

  const isVitrin = badgeType === 'showcase' || badgeType === 'featured';

  const resolvedImg =
    coverUri ||
    (isVitrin
      ? 'https://images.unsplash.com/photo-1475518112798-86ae358241eb?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80');

  const resolvedTitle = (
    displayTitle && displayTitle !== 'İlan Başlığınız Burada Görünecek'
      ? displayTitle
      : isVitrin
        ? 'ABATHAN'
        : 'ABARİS'
  ).toUpperCase();

  const resolvedLocation =
    location && location !== 'Konum Belirtilmedi'
      ? location
      : isVitrin
        ? 'Bozkurt, Denizli'
        : 'Çay, Afyonkarahisar';

  const resolvedPrice =
    displayPrice && displayPrice !== 'Fiyat Belirtilmedi'
      ? displayPrice
      : isVitrin
        ? '₺2.600.000'
        : '₺250.000';

  // Vitrin / Öne Çıkan Görünümü (Kullanıcının ABATHAN ekran görüntüsü)
  if (isVitrin) {
    return (
      <View style={styles.mockVitrinCard}>
        {/* Görsel Alanı (Geniş yuvarlatılmış köşeler) */}
        <View style={[styles.mockVitrinImageWrap, { backgroundColor: skeleton }]}>
          <Image
            source={{ uri: resolvedImg }}
            style={styles.mockCardImage}
            contentFit="cover"
          />

          {/* Rozet (Ekran görüntüsündeki gibi: ★ Öne çıkan) */}
          <View style={styles.mockVitrinBadge}>
            <Ionicons name="star" size={9.5} color="#ffffff" />
            <Text style={styles.mockVitrinBadgeText}>
              {badgeLabel || 'Öne çıkan'}
            </Text>
          </View>

          {/* Favori Kalp Butonu (Ekran görüntüsündeki sağ üst beyaz çizgi kalp) */}
          <View style={styles.mockVitrinFavBtn}>
            <Ionicons name="heart-outline" size={21} color="#ffffff" />
          </View>
        </View>

        {/* Kart Gövdesi (Başlık -> Konum İkonu + Konum -> Fiyat) */}
        <View style={styles.mockVitrinBody}>
          <Text style={[styles.mockVitrinTitle, { color: text }]} numberOfLines={1}>
            {resolvedTitle}
          </Text>

          <View style={styles.mockVitrinMetaRow}>
            <Ionicons name="location-outline" size={12} color={textMuted} />
            <Text style={[styles.mockVitrinLocation, { color: textMuted }]} numberOfLines={1}>
              {resolvedLocation}
            </Text>
          </View>

          <Text style={[styles.mockVitrinPrice, { color: text }]}>
            {resolvedPrice}
          </Text>
        </View>
      </View>
    );
  }

  // Acil / Standart Görünümü
  const badgeColor =
    badgeType === 'urgent'
      ? URGENT_RED
      : null;

  return (
    <View
      style={[
        styles.mockCard,
        {
          backgroundColor: '#161922',
          borderColor: border,
        },
      ]}
    >
      {/* Görsel Alanı */}
      <View style={[styles.mockCardImageWrap, { backgroundColor: skeleton }]}>
        <Image
          source={{ uri: resolvedImg }}
          style={styles.mockCardImage}
          contentFit="cover"
        />

        {/* Rozet (Ekran görüntüsündeki gibi: Acil) */}
        {badgeLabel && badgeColor ? (
          <View style={[styles.mockCardBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.mockCardBadgeText}>{badgeLabel}</Text>
          </View>
        ) : null}

        {/* Favori Kalp Butonu (Ekran görüntüsündeki sağ üst pembe kalp) */}
        <View style={styles.mockFavBtn}>
          <Ionicons name="heart" size={17} color="#f43f5e" />
        </View>
      </View>

      {/* Kart Gövdesi (Başlık -> Konum -> Fiyat) */}
      <View style={styles.mockCardBody}>
        <Text style={[styles.mockCardTitle, { color: text }]} numberOfLines={1}>
          {resolvedTitle}
        </Text>

        <Text style={[styles.mockCardLocation, { color: textMuted }]} numberOfLines={1}>
          {resolvedLocation}
        </Text>

        <Text style={[styles.mockCardPrice, { color: text }]}>
          {resolvedPrice}
        </Text>
      </View>
    </View>
  );
}

function InstagramPostPreview({
  coverUri,
  displayTitle,
  displayPrice,
  location,
  categoryName,
}: {
  coverUri: string | null;
  displayTitle: string;
  displayPrice: string;
  location: string;
  categoryName: string;
}) {
  const skeleton = useThemeColor('skeleton');

  const resolvedImg =
    coverUri ||
    'https://images.unsplash.com/photo-1475518112798-86ae358241eb?auto=format&fit=crop&w=800&q=80';

  const resolvedTitle = (
    displayTitle && displayTitle !== 'İlan Başlığınız Burada Görünecek'
      ? displayTitle
      : 'ABATHAN'
  ).toUpperCase();

  const resolvedLocation =
    location && location !== 'Konum Belirtilmedi'
      ? location
      : 'Bozkurt, Denizli';

  const resolvedPrice =
    displayPrice && displayPrice !== 'Fiyat Belirtilmedi'
      ? displayPrice
      : '₺2.600.000';

  return (
    <View style={styles.igCard}>
      {/* 1. Header: Story Avatar, Kullanıcı Adı, Onay Rozeti, Sponsorlu Etiketi, 3 Nokta */}
      <View style={styles.igHeader}>
        <View style={styles.igHeaderLeft}>
          <View style={styles.igStoryRing}>
            <View style={styles.igAvatarInner}>
              <Text style={styles.igAvatarLetter}>H</Text>
            </View>
          </View>
          <View style={styles.igUserMeta}>
            <View style={styles.igUserRow}>
              <Text style={styles.igUsername}>haradan.official</Text>
              <Ionicons
                name="checkmark-circle"
                size={12}
                color="#3897f0"
                style={styles.igVerifiedBadge}
              />
            </View>
            <Text style={styles.igSponsored}>Sponsorlu</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color="#a8a8a8" />
      </View>

      {/* 2. Medya: 1:1 Kare Gönderi Fotoğrafı */}
      <View style={[styles.igMediaWrap, { backgroundColor: skeleton }]}>
        <Image
          source={{ uri: resolvedImg }}
          style={styles.igMedia}
          contentFit="cover"
        />
      </View>

      {/* 3. Instagram Sponsorlu CTA Çubuğu */}
      <View style={styles.igCtaBar}>
        <Text style={styles.igCtaText}>Daha Fazla Bilgi Al</Text>
        <Ionicons name="chevron-forward" size={13} color="#ffffff" />
      </View>

      {/* 4. Etkileşim Butonları: Beğen, Yorum, Paylaş, Kaydet */}
      <View style={styles.igActionsRow}>
        <View style={styles.igActionsLeft}>
          <Ionicons name="heart" size={19} color="#f43f5e" />
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color="#ffffff"
            style={styles.igActionIcon}
          />
          <Ionicons
            name="paper-plane-outline"
            size={17}
            color="#ffffff"
            style={styles.igActionIcon}
          />
        </View>
        <Ionicons name="bookmark-outline" size={17} color="#ffffff" />
      </View>

      {/* 5. Beğenme Sayısı ve Kompakt Açıklama Metni */}
      <View style={styles.igContentBlock}>
        <Text style={styles.igLikesCount}>2.450 beğenme</Text>

        <Text style={styles.igCaptionText} numberOfLines={2}>
          <Text style={styles.igCaptionUsername}>haradan.official </Text>
          🏇 <Text style={styles.igCaptionHighlight}>{resolvedTitle}</Text> · {categoryName}
        </Text>

        <Text style={styles.igCaptionDetails} numberOfLines={1}>
          📍 {resolvedLocation}   ·   💰 {resolvedPrice}
        </Text>

        <Text style={styles.igCommentsLink} numberOfLines={1}>
          24 yorumun tümünü gör · 2 saat önce
        </Text>
      </View>
    </View>
  );
}

type TabKey = 'urgent' | 'showcase' | 'category' | 'social';

type PlacementDef = {
  key: TabKey;
  tabLabel: string;
  tabIcon: keyof typeof Ionicons.glyphMap;
  badgeColor: string;
  locationTag: string;
  title: string;
  description: string;
  sectionTitle: string;
  badgeLabel?: string;
  badgeType?: 'urgent' | 'showcase' | 'featured' | null;
  isSocial?: boolean;
};

export const PackagePreviewModal = memo(function PackagePreviewModal({
  visible,
  pkg,
  draft,
  onClose,
  onSelectPackage,
}: PackagePreviewModalProps) {
  const bg = useThemeColor('background');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const success = useThemeColor('success');

  if (!pkg) return null;

  const coverUri =
    draft.media.find((m) => m.isCover)?.uri ||
    draft.media[0]?.uri ||
    null;

  const displayTitle =
    (draft.details.title || '').trim() || 'İlan Başlığınız Burada Görünecek';

  const priceNum = parseFloat(
    (draft.details.priceTl || '').replace(/\./g, '').replace(',', '.')
  );
  const displayPrice =
    !isNaN(priceNum) && priceNum > 0
      ? formatMoney({ amountMinor: Math.round(priceNum * 100), currency: 'TRY' })
      : draft.details.priceTl
        ? `${draft.details.priceTl} TL`
        : 'Fiyat Belirtilmedi';

  const location =
    locationLookup.formatLocation(
      draft.details.districtId,
      draft.details.provinceId
    ) || 'Konum Belirtilmedi';

  const categoryName = draft.type?.categoryName || 'Satılık';

  const codeUpper = (pkg.code || '').toUpperCase();

  const hasUrgent =
    pkg.allowsUrgent === true ||
    codeUpper === 'PREMIUM' ||
    codeUpper === 'ULTIMATE' ||
    pkg.features.some(
      (f) =>
        f.included &&
        (f.id.toLowerCase().includes('urgent') ||
          f.label.toLowerCase().includes('acil'))
    );

  const hasShowcase =
    pkg.showcaseEligible === true ||
    codeUpper === 'ULTIMATE' ||
    pkg.features.some(
      (f) =>
        f.included &&
        (f.id.toLowerCase().includes('showcase') ||
          f.label.toLowerCase().includes('vitrin'))
    );

  const hasFeatured =
    (pkg.featuredDays ?? 0) > 0 ||
    codeUpper === 'PREMIUM' ||
    codeUpper === 'ULTIMATE' ||
    pkg.features.some(
      (f) =>
        f.included &&
        (f.id.toLowerCase().includes('featured') ||
          f.label.toLowerCase().includes('öne çıkan'))
    );

  const hasSocial =
    codeUpper === 'PREMIUM' ||
    codeUpper === 'ULTIMATE' ||
    pkg.features.some(
      (f) =>
        f.included &&
        (f.id.toLowerCase().includes('social') ||
          f.label.toLowerCase().includes('sosyal'))
    );

  // Define placements included in this package
  const placements: PlacementDef[] = [];

  if (hasShowcase) {
    placements.push({
      key: 'showcase',
      tabLabel: 'Anasayfa Vitrini',
      tabIcon: 'trophy',
      badgeColor: GOLD_AMBER,
      locationTag: 'ANASAYFA · ANA VİTRİN',
      title: 'Anasayfa Vitrin İlanları',
      description:
        'Anasayfanın ana vitrin bölümünde Öne Çıkan rozeti ve şık vitrin kartı tasarımıyla sergilenir.',
      sectionTitle: 'Vitrin İlanları',
      badgeLabel: 'Öne çıkan',
      badgeType: 'showcase',
    });
  }

  if (hasUrgent) {
    placements.push({
      key: 'urgent',
      tabLabel: 'Acil Vitrini',
      tabIcon: 'flash',
      badgeColor: URGENT_RED,
      locationTag: 'ANASAYFA · EN ÜST BANT',
      title: 'Acil Satılık İlanlar Vitrini',
      description:
        'Anasayfanın en tepesinde dikkat çekici kırmızı ACİL rozetiyle alıcıların ilk gördüğü vitrinde yer alır.',
      sectionTitle: 'Acil Satılık İlanlar',
      badgeLabel: 'Acil',
      badgeType: 'urgent',
    });
  }

  // Always present: Category & search listing
  placements.push({
    key: 'category',
    tabLabel: hasFeatured ? 'Öne Çıkanlar' : 'Arama Listesi',
    tabIcon: hasFeatured ? 'star' : 'list',
    badgeColor: hasFeatured ? FEATURED_BLUE : SUCCESS_GREEN,
    locationTag: 'KATEGORİ & ARAMA LİSTESİ',
    title: hasFeatured ? 'Öne Çıkan İlan (En Üst Sıra)' : 'Standart Kategori Listesi',
    description: hasFeatured
      ? 'Kategori ve arama sonuçlarında mavi ÖNE ÇIKAN rozetiyle standart ilanların üstünde ilk sırada çıkar.'
      : 'Kategori ve arama sonuçlarında standart ilan kartı görünümüyle listelenir.',
    sectionTitle: `${categoryName} İlanları`,
    badgeLabel: hasFeatured ? 'Öne Çıkan' : undefined,
    badgeType: hasFeatured ? 'featured' : null,
  });

  if (hasSocial) {
    placements.push({
      key: 'social',
      tabLabel: 'Sosyal Medya',
      tabIcon: 'share-social',
      badgeColor: '#ec4899',
      locationTag: 'INSTAGRAM & FACEBOOK',
      title: 'Sosyal Medya Paylaşımı',
      description:
        'İlanınız Haradan’ın resmi sosyal medya hesaplarında özel hikaye formatında binlerce takipçiye duyurulur.',
      sectionTitle: 'haradan.official Sponsorlu Gönderi',
      badgeLabel: hasUrgent ? 'ACİL İLAN' : hasShowcase ? 'VİTRİN' : 'ÖNE ÇIKAN',
      badgeType: hasUrgent ? 'urgent' : hasShowcase ? 'showcase' : 'featured',
      isSocial: true,
    });
  }

  // Active placement state
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    placements[0]?.key || 'category'
  );

  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= HOME_DESKTOP_BREAKPOINT;

  // Ensure active tab exists in available placements
  const currentPlacement =
    placements.find((p) => p.key === activeTabKey) || placements[0];

  const placementBanner = (
    <View
      style={[
        styles.placementInfoBanner,
        {
          backgroundColor: currentPlacement.badgeColor + '12',
          borderColor: currentPlacement.badgeColor + '40',
          borderLeftColor: currentPlacement.badgeColor,
        },
      ]}
    >
      <View style={styles.placementInfoTop}>
        <View
          style={[
            styles.placementColorDot,
            { backgroundColor: currentPlacement.badgeColor },
          ]}
        />
        <Text
          style={[
            styles.placementLocationTag,
            { color: currentPlacement.badgeColor },
          ]}
        >
          {currentPlacement.locationTag}
        </Text>
      </View>
      <Text style={[styles.placementTitle, { color: text }]}>
        {currentPlacement.title}
      </Text>
      <Text style={[styles.placementDesc, { color: textSecondary }]}>
        {currentPlacement.description}
      </Text>
    </View>
  );

  const previewContent = currentPlacement.isSocial ? (
    <InstagramPostPreview
      coverUri={coverUri}
      displayTitle={displayTitle}
      displayPrice={displayPrice}
      location={location}
      categoryName={categoryName}
    />
  ) : (
    <View
      style={[
        styles.previewFrame,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      {/* Site Section Simulator Bar */}
      <View style={styles.sectionHeaderSim}>
        <View style={styles.simHeadingLeft}>
          <Ionicons
            name={currentPlacement.tabIcon}
            size={16}
            color={currentPlacement.badgeColor}
          />
          <Text
            style={[styles.simHeadingTitle, { color: text }]}
            numberOfLines={1}
          >
            {currentPlacement.sectionTitle}
          </Text>
        </View>
        <Text
          style={[
            styles.simHeadingAction,
            { color: currentPlacement.badgeColor },
          ]}
        >
          Tümünü gör ›
        </Text>
      </View>

      {/* Centered Advert Card */}
      <View style={styles.cardPreviewContainer}>
        <PreviewAdvertCard
          coverUri={coverUri}
          categoryName={categoryName}
          displayTitle={displayTitle}
          displayPrice={displayPrice}
          location={location}
          badgeType={currentPlacement.badgeType}
          badgeLabel={currentPlacement.badgeLabel}
          isUnlocked={true}
        />
      </View>
    </View>
  );

  const featuresCard = (
    <View
      style={[
        styles.featuresCard,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <View style={styles.featuresCardHeader}>
        <Ionicons name="sparkles-outline" size={16} color={primary} />
        <Text style={[styles.featuresCardTitle, { color: text }]}>
          {pkg.name} Paket Özellikleri
        </Text>
      </View>

      <View style={styles.featuresList}>
        {/* Yayın Süresi */}
        <View style={styles.featureItemRow}>
          <View
            style={[
              styles.featureCheckCircle,
              { backgroundColor: success + '20' },
            ]}
          >
            <Ionicons name="checkmark" size={13} color={success} />
          </View>
          <Text style={[styles.featureItemText, { color: text }]}>
            <Text style={{ fontWeight: '700' }}>
              {pkg.durationDays} gün
            </Text>{' '}
            aktif yayın süresi
          </Text>
        </View>

        {/* Paketin Tanımlı Özellikleri */}
        {pkg.features
          .filter(
            (f) =>
              !f.label.toLowerCase().endsWith('gün yayın') &&
              !f.label.toLowerCase().endsWith('gun yayin')
          )
          .map((f) => (
          <View key={f.id} style={styles.featureItemRow}>
            <View
              style={[
                styles.featureCheckCircle,
                {
                  backgroundColor: f.included
                    ? success + '20'
                    : border + '40',
                },
              ]}
            >
              <Ionicons
                name={f.included ? 'checkmark' : 'close'}
                size={13}
                color={f.included ? success : textMuted}
              />
            </View>
            <Text
              style={[
                styles.featureItemText,
                {
                  color: f.included ? text : textMuted,
                  textDecorationLine: f.included
                    ? 'none'
                    : 'line-through',
                },
              ]}
            >
              {f.label}
            </Text>
          </View>
        ))}

        {/* Acil Rozeti (Pakette varsa ve listede yoksa) */}
        {hasUrgent &&
        !pkg.features.some((f) =>
          f.label.toLowerCase().includes('acil')
        ) ? (
          <View style={styles.featureItemRow}>
            <View
              style={[
                styles.featureCheckCircle,
                { backgroundColor: URGENT_RED + '20' },
              ]}
            >
              <Ionicons name="flash" size={13} color={URGENT_RED} />
            </View>
            <Text style={[styles.featureItemText, { color: text }]}>
              Kırmızı{' '}
              <Text style={{ fontWeight: '700', color: URGENT_RED }}>
                ACİL
              </Text>{' '}
              ilan rozeti ve anasayfa vitrini
            </Text>
          </View>
        ) : null}

        {/* Anasayfa Vitrini (Pakette varsa ve listede yoksa) */}
        {hasShowcase &&
        !pkg.features.some((f) =>
          f.label.toLowerCase().includes('vitrin')
        ) ? (
          <View style={styles.featureItemRow}>
            <View
              style={[
                styles.featureCheckCircle,
                { backgroundColor: GOLD_AMBER + '20' },
              ]}
            >
              <Ionicons name="trophy" size={13} color={GOLD_AMBER} />
            </View>
            <Text style={[styles.featureItemText, { color: text }]}>
              Altın{' '}
              <Text style={{ fontWeight: '700', color: GOLD_AMBER }}>
                VİTRİN
              </Text>{' '}
              rozetli ana vitrin bandı
            </Text>
          </View>
        ) : null}

        {/* Sosyal Medya (Pakette varsa ve listede yoksa) */}
        {hasSocial &&
        !pkg.features.some((f) =>
          f.label.toLowerCase().includes('sosyal')
        ) ? (
          <View style={styles.featureItemRow}>
            <View
              style={[
                styles.featureCheckCircle,
                { backgroundColor: '#ec489920' },
              ]}
            >
              <Ionicons
                name="share-social"
                size={13}
                color="#ec4899"
              />
            </View>
            <Text style={[styles.featureItemText, { color: text }]}>
              Resmi Instagram & Facebook hesaplarında paylaşım
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={isWide}
      animationType={isWide ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={isWide ? styles.overlayWide : styles.overlayMobile}>
        <View
          style={[
            isWide ? styles.modalCardWide : styles.modalCardMobile,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border, backgroundColor: surface }]}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.kickerRow}>
                <View style={[styles.pkgBadge, { backgroundColor: primary + '20' }]}>
                  <Ionicons name="sparkles" size={13} color={primary} />
                  <Text style={[styles.kicker, { color: primary }]}>
                    {pkg.name} Paket
                  </Text>
                </View>
                <Text style={[styles.pkgDuration, { color: textMuted }]}>
                  {pkg.durationDays} gün aktif yayın
                </Text>
              </View>
              <Text style={[styles.modalTitle, { color: text }]}>
                İlanınız Nerede Nasıl Görünecek?
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={[styles.closeBtn, { borderColor: border, backgroundColor: bg }]}
            >
              <Ionicons name="close" size={20} color={text} />
            </Pressable>
          </View>

          {/* Placement Tabs (Only if > 1 placement) */}
          {placements.length > 1 ? (
            <View style={[styles.tabBarWrapper, { borderBottomColor: border, backgroundColor: bg }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarContent}
              >
                {placements.map((p) => {
                  const isActive = p.key === currentPlacement.key;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => setActiveTabKey(p.key)}
                      style={[
                        styles.tabBtn,
                        isActive
                          ? [
                              styles.tabBtnActive,
                              {
                                backgroundColor: p.badgeColor + '18',
                                borderColor: p.badgeColor,
                              },
                            ]
                          : [
                              styles.tabBtnInactive,
                              {
                                backgroundColor: surface,
                                borderColor: border,
                              },
                            ],
                      ]}
                    >
                      <Ionicons
                        name={p.tabIcon}
                        size={14}
                        color={isActive ? p.badgeColor : textMuted}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: isActive ? text : textMuted,
                            fontWeight: isActive ? '700' : '500',
                          },
                        ]}
                      >
                        {p.tabLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Body Content - 2 Column Layout on Desktop, 1 Column on Mobile */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isWide ? (
              <View style={styles.twoColWrap}>
                {/* Sol Sütun: Önizleme */}
                <View style={styles.leftCol}>
                  {previewContent}
                </View>

                {/* Sağ Sütun: Konum Bilgisi & Paket Özellikleri */}
                <View style={styles.rightCol}>
                  {placementBanner}
                  {featuresCard}
                </View>
              </View>
            ) : (
              <View style={styles.oneColWrap}>
                {/* Mobilde 1: Yeşil/Rozet Renkli Konum Bilgilendirme Kutusu ÜSTTE */}
                {placementBanner}

                {/* Mobilde 2: Kart Önizleme Simülatörü */}
                {previewContent}

                {/* Mobilde 3: Paket Özellikleri Listesi */}
                {featuresCard}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: border, backgroundColor: surface }]}>
            <View style={styles.priceMeta}>
              <Text style={[styles.priceTag, { color: text }]}>
                {formatMoney(pkg.price)}
              </Text>
              <Text style={[styles.durationTag, { color: textSecondary }]}>
                {pkg.durationDays} gün yayın
              </Text>
            </View>
            <View style={styles.footerButtons}>
              <Button
                variant="secondary"
                size={isWide ? 'md' : 'sm'}
                onPress={onClose}
                accessibilityLabel="Kapat"
              >
                Kapat
              </Button>
              <Button
                variant="primary"
                size={isWide ? 'md' : 'sm'}
                onPress={() => onSelectPackage(pkg.code)}
                accessibilityLabel="Bu Paketi Seç"
              >
                Bu Paketi Seç
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlayWide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  overlayMobile: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalCardWide: {
    width: '100%',
    maxWidth: 860,
    maxHeight: '92%',
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 56px rgba(0, 0, 0, 0.3)',
      },
      default: {
        elevation: 16,
      },
    }),
  },
  modalCardMobile: {
    flex: 1,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitleWrap: { flex: 1, gap: 4 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pkgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pkgDuration: {
    ...Typography.caption,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    ...Platform.select({
      web: { fontSize: 20, lineHeight: 26 },
      default: {},
    }),
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.avatar,
    borderWidth: 1,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' as const, userSelect: 'none' as const },
      default: {},
    }),
  },
  tabBtnActive: {},
  tabBtnInactive: {},
  tabText: {
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  twoColWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  oneColWrap: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacing.md,
    width: '100%',
  },
  leftCol: {
    width: 340,
    maxWidth: 360,
  },
  rightCol: {
    flex: 1,
    gap: Spacing.md,
  },
  mobileFullCol: {
    width: '100%',
    gap: Spacing.md,
  },
  placementInfoBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: Spacing.md,
    gap: 6,
  },
  placementInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placementColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  placementLocationTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  placementTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  placementDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  previewFrame: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  sectionHeaderSim: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  simHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  simHeadingTitle: {
    ...Typography.h5,
    fontWeight: '700',
    flexShrink: 1,
  },
  simHeadingAction: {
    ...Typography.caption,
    fontWeight: '600',
  },
  cardPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  mockCard: {
    width: 250,
    maxWidth: '100%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      },
      default: {
        elevation: 6,
      },
    }),
  },
  mockCardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  mockCardImage: {
    width: '100%',
    height: '100%',
  },
  mockCardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockCardBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mockFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 3,
  },
  mockCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mockCardLocation: {
    fontSize: 11,
    marginTop: 1,
  },
  mockCardPrice: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  // Vitrin Kartı Özel Stilleri (ABATHAN ekran görüntüsü ile birebir eşleşme)
  mockVitrinCard: {
    width: 250,
    maxWidth: '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  mockVitrinImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  mockVitrinBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0c0c0e',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockVitrinBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mockVitrinFavBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockVitrinBody: {
    paddingHorizontal: 2,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  mockVitrinTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mockVitrinMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockVitrinLocation: {
    fontSize: 11.5,
    flexShrink: 1,
  },
  mockVitrinPrice: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.25,
    marginTop: 2,
  },
  // Instagram Gönderisi Özel Stilleri (Kompakt ve taşmayan Instagram UI)
  igCard: {
    width: 260,
    maxWidth: '100%',
    alignSelf: 'center',
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
      },
      default: {
        elevation: 6,
      },
    }),
  },
  igHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#000000',
  },
  igHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  igStoryRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    padding: 1.5,
    backgroundColor: '#d62976',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#161922',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  igAvatarLetter: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  igUserMeta: {
    gap: 0,
  },
  igUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  igUsername: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  igVerifiedBadge: {
    marginLeft: 1,
  },
  igSponsored: {
    color: '#a8a8a8',
    fontSize: 9.5,
    fontWeight: '400',
  },
  igMediaWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#121212',
  },
  igMedia: {
    width: '100%',
    height: '100%',
  },
  igCtaBar: {
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#363636',
  },
  igCtaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  igActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 4,
    backgroundColor: '#000000',
  },
  igActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  igActionIcon: {
    marginLeft: 10,
  },
  igContentBlock: {
    paddingHorizontal: 10,
    paddingBottom: 9,
    gap: 2,
    backgroundColor: '#000000',
  },
  igLikesCount: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  igCaptionText: {
    color: '#f5f5f5',
    fontSize: 10.5,
    lineHeight: 14,
  },
  igCaptionUsername: {
    color: '#ffffff',
    fontWeight: '700',
  },
  igCaptionHighlight: {
    fontWeight: '700',
    color: '#ffffff',
  },
  igCaptionDetails: {
    color: '#e0e0e0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  igCommentsLink: {
    color: '#737373',
    fontSize: 9.5,
    marginTop: 2,
  },
  featuresCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
  },
  featuresCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  featuresCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  featuresList: {
    gap: 10,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureItemText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  priceMeta: {
    gap: 1,
    flexShrink: 1,
  },
  priceTag: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    ...Platform.select({
      web: { fontSize: 24 },
      default: {},
    }),
  },
  durationTag: {
    ...Typography.caption,
    fontSize: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
});
