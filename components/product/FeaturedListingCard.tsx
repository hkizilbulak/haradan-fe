import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useMediaImageSource } from '@/hooks/useMediaImageSource';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import { WishlistButton } from '@/components/advert/WishlistButton';
import { RemoveDraftButton } from '@/components/advert/RemoveDraftButton';
import { MarkSoldButton } from '@/components/advert/MarkSoldButton';
import { SoldOverlay } from '@/components/advert/SoldOverlay';
import { useListingCardAttributes } from './cardAttributes';
import type { CatalogProductCard } from '@/types';
import type { AdvertId } from '@/types/advertId';

const URGENT_RED = '#e11d48';
const FEATURED_INK = '#0c0c0e';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export type FeaturedCardBadge = 'urgent' | 'featured';

type FeaturedListingCardProps = {
  product: CatalogProductCard;
  width?: number;
  /** Mobil grid — daha küçük görsel ve tipografi. */
  compact?: boolean;
  /** Bölüme göre rozet; verilmezse isUrgent → ACİL. */
  badge?: FeaturedCardBadge | 'auto';
  /** Sahip önizlemesi (incelemede / taslak) için Bearer. */
  accessToken?: string | null;
  onPress?: (id: AdvertId) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
  showFavorite?: boolean;
  /** Taslak sekmesi — favori yanındaki kırmızı eksi. */
  onRemove?: (id: AdvertId) => void;
  removing?: boolean;
  /** Yayında sekmesi — satıldı olarak işaretle butonu. */
  onMarkSold?: (id: AdvertId) => void;
  markingSold?: boolean;
};


function FeaturedListingCardComponent({
  product,
  width,
  compact = false,
  badge = 'auto',
  accessToken,
  onPress,
  onToggleFavorite,
  showFavorite,
  onRemove,
  removing = false,
  onMarkSold,
  markingSold = false,
}: FeaturedListingCardProps) {
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const skeleton = useThemeColor('skeleton');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const chipBg = useThemeColor('background');

  const hover = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

  const attrs = useListingCardAttributes(product);
  const coverSource = useMediaImageSource(
    product.cover?.publicUrl,
    accessToken
  );

  const resolvedBadge: FeaturedCardBadge | null =
    badge === 'featured'
      ? 'featured'
      : badge === 'urgent'
        ? 'urgent'
        : product.isUrgent
          ? 'urgent'
          : product.isFeatured
            ? 'featured'
            : null;

  const handlePress = useCallback(
    () => onPress?.(product.id),
    [onPress, product.id]
  );
  const handleFavorite = useCallback(() => {
    onToggleFavorite?.(product);
  }, [onToggleFavorite, product]);
  const handleRemove = useCallback(() => {
    onRemove?.(product.id);
  }, [onRemove, product.id]);

  const handleMarkSold = useCallback(() => {
    onMarkSold?.(product.id);
  }, [onMarkSold, product.id]);

  const isSold = (product as { backendStatus?: string }).backendStatus === 'SOLD';
  const isRejected =
    (product as { backendStatus?: string }).backendStatus === 'REJECTED' ||
    (product as { status?: string }).status === 'rejected';
  const isDraft =
    (product as { backendStatus?: string }).backendStatus === 'DRAFT' ||
    (product as { backendStatus?: string }).backendStatus === 'CHANGES_REQUESTED' ||
    (product as { backendStatus?: string }).backendStatus === 'SUSPENDED' ||
    (product as { backendStatus?: string }).backendStatus === 'ARCHIVED' ||
    (product as { status?: string }).status === 'draft';
  const shouldShowFavorite =
    !isRejected &&
    !isDraft &&
    (showFavorite !== undefined ? showFavorite : Boolean(onToggleFavorite));
  const hasActions = Boolean(onRemove || onMarkSold || shouldShowFavorite);

  const animateHover = useCallback(
    (to: number) => {
      setHovered(to > 0);
      Animated.timing(hover, {
        toValue: to,
        duration: 320,
        easing: EASE,
        useNativeDriver: true,
      }).start();
    },
    [hover]
  );

  const lift = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const imgScale = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const cityLabel = attrs.province || 'Türkiye';

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => animateHover(1)}
      onHoverOut={() => animateHover(0)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${cityLabel}`}
      {...(Platform.OS === 'web'
        ? ({ dataSet: { keepSearch: 'true' } } as object)
        : null)}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        width ? { width } : null,
        {
          backgroundColor: surface,
          borderColor: border,
          opacity: pressed ? 0.94 : 1,
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              userSelect: 'none' as const,
              boxShadow: hovered
                ? '0 12px 28px -4px rgba(15, 23, 42, 0.12)'
                : '0 4px 18px -2px rgba(15, 23, 42, 0.05)',
            },
            default: {},
          }),
        },
      ]}
    >
      <Animated.View
        style={[
          styles.motion,
          compact && styles.motionCompact,
          {
            transform: [{ translateY: lift }],
          },
        ]}
      >
        {/* Görsel Alanı */}
        <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
          <Animated.View
            style={[styles.imageInner, { transform: [{ scale: imgScale }] }]}
          >
            <Image
              source={coverSource}
              style={[styles.image, { backgroundColor: skeleton }]}
              contentFit="cover"
              transition={240}
              recyclingKey={String(product.id)}
              priority="low"
              cachePolicy={accessToken ? 'memory' : 'memory-disk'}
            />
          </Animated.View>
          <View
            pointerEvents="none"
            style={[styles.scrim, { opacity: hovered ? 1 : 0 }]}
          />
          {isSold ? <SoldOverlay /> : null}

          {/* Sol Üst Rozet: ● ACİL veya ★ Öne Çıkan */}
          {resolvedBadge === 'urgent' ? (
            <View style={[styles.pill, styles.urgentPill, compact && styles.pillCompact]}>
              <View style={styles.urgentDot} />
              <Text style={[styles.urgentText, compact && styles.urgentTextCompact]}>
                ACİL
              </Text>
            </View>
          ) : null}
          {resolvedBadge === 'featured' ? (
            <View style={[styles.pill, styles.featuredPill, compact && styles.pillCompact]}>
              <Ionicons name="star" size={compact ? 8 : 10} color="#f59e0b" />
              <Text style={[styles.featuredText, compact && styles.featuredTextCompact]}>
                Öne çıkan
              </Text>
            </View>
          ) : null}

          {/* Sağ Üst: Yuvarlak Beyaz Favori ve Yönetim Butonları */}
          {hasActions ? (
            <View style={styles.wishWrap}>
              {onRemove ? (
                <RemoveDraftButton
                  disabled={removing}
                  onPress={handleRemove}
                />
              ) : null}
              {onMarkSold ? (
                <MarkSoldButton
                  disabled={markingSold || isSold}
                  onPress={handleMarkSold}
                />
              ) : null}
              {shouldShowFavorite ? (
                <WishlistButton
                  active={product.isFavorite === true}
                  variant="circle"
                  size={compact ? 'sm' : 'md'}
                  onPress={handleFavorite}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Kart Gövdesi */}
        <View style={[styles.body, compact && styles.bodyCompact]}>
          {/* 1. Başlık */}
          <Text
            style={[styles.title, compact && styles.titleCompact, { color: text }]}
            numberOfLines={compact ? 1 : 2}
          >
            {product.title}
          </Text>

          {/* 2. Fiyat (solda), Dikey Çizgi ve İl (sağda) */}
          <View style={styles.priceLocationRow}>
            <Text style={[styles.price, compact && styles.priceCompact, { color: text }]} numberOfLines={1}>
              {formatMoney(product.price)}
            </Text>
            <View style={[styles.priceLocationDivider, { backgroundColor: border }]} />
            <View style={styles.locationWrap}>
              <Ionicons name="location-outline" size={compact ? 12 : 14} color={textSecondary} />
              <Text
                style={[styles.provinceText, compact && styles.provinceTextCompact, { color: textSecondary }]}
                numberOfLines={1}
              >
                {cityLabel}
              </Text>
            </View>
          </View>

          {/* 3. Cinsiyet, Yaş, Irk, Boy kutucukları (İkonlu) */}
          {attrs.serviceCategory ? (
            <View style={styles.boxesRow}>
              <View style={[styles.boxItem, compact && styles.boxItemCompact, { backgroundColor: chipBg }]}>
                <Ionicons
                  name="briefcase-outline"
                  size={compact ? 11 : 13}
                  color={textSecondary}
                  style={styles.boxIcon}
                />
                <Text style={[styles.boxText, compact && styles.boxTextCompact, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.serviceCategory}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.boxesRow}>
              {/* Kutucuk 1: Cinsiyet */}
              <View style={[styles.boxItem, compact && styles.boxItemCompact, { backgroundColor: chipBg }]}>
                <Ionicons
                  name={
                    attrs.gender === 'Dişi'
                      ? 'female'
                      : attrs.gender === 'İğdiş'
                        ? 'male-female'
                        : 'male'
                  }
                  size={compact ? 11 : 13}
                  color={textSecondary}
                  style={styles.boxIcon}
                />
                <Text style={[styles.boxText, compact && styles.boxTextCompact, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.gender || 'Erkek'}
                </Text>
              </View>

              {/* Kutucuk 2: Yaş */}
              <View style={[styles.boxItem, compact && styles.boxItemCompact, { backgroundColor: chipBg }]}>
                <Ionicons
                  name="calendar-outline"
                  size={compact ? 11 : 13}
                  color={textSecondary}
                  style={styles.boxIcon}
                />
                <Text style={[styles.boxText, compact && styles.boxTextCompact, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.age || '4 yaş'}
                </Text>
              </View>

              {/* Kutucuk 3: Irk */}
              <View style={[styles.boxItem, compact && styles.boxItemCompact, { backgroundColor: chipBg }]}>
                <FontAwesome5
                  name="horse-head"
                  size={compact ? 10 : 12}
                  color={textSecondary}
                  style={styles.boxIcon}
                />
                <Text style={[styles.boxText, compact && styles.boxTextCompact, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.breed || 'Arap'}
                </Text>
              </View>

              {/* Kutucuk 4: Boy / Cidago (Varsa) */}
              {attrs.height ? (
                <View style={[styles.boxItem, compact && styles.boxItemCompact, { backgroundColor: chipBg }]}>
                  <MaterialCommunityIcons
                    name="ruler"
                    size={compact ? 11 : 13}
                    color={textSecondary}
                    style={styles.boxIcon}
                  />
                  <Text style={[styles.boxText, compact && styles.boxTextCompact, { color: textSecondary }]} numberOfLines={1}>
                    {attrs.height}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const FeaturedListingCard = memo(FeaturedListingCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      default: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  cardCompact: {
    borderRadius: 14,
  },
  motion: {
    width: '100%',
  },
  motionCompact: {
    width: '100%',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    overflow: 'hidden',
    position: 'relative',
  },
  imageWrapCompact: {
    aspectRatio: 4 / 3,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  imageInner: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,14,0.06)',
    ...Platform.select({
      web: {
        transition: 'opacity 320ms cubic-bezier(0.22,1,0.36,1)',
      },
      default: {},
    }),
  },
  pill: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
  },
  pillCompact: {
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  urgentPill: {
    backgroundColor: URGENT_RED,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(225, 29, 72, 0.35)',
      },
      default: {
        shadowColor: '#e11d48',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  urgentText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  urgentTextCompact: {
    fontSize: 7.5,
    letterSpacing: 0.8,
  },
  featuredPill: {
    backgroundColor: FEATURED_INK,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  featuredTextCompact: {
    fontSize: 7.5,
  },
  wishWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  body: {
    gap: 8,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 15,
  },
  bodyCompact: {
    gap: 5,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    fontWeight: '700',
    fontSize: 14.5,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  priceLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  priceLocationDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 8,
    opacity: 0.8,
  },
  provinceText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  provinceTextCompact: {
    fontSize: 11,
  },
  price: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 0,
  },
  priceCompact: {
    fontSize: 13.5,
  },
  boxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    marginTop: 6,
  },
  boxItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 3.5,
  },
  boxItemCompact: {
    paddingHorizontal: 2,
    paddingVertical: 3.5,
    gap: 2,
  },
  boxIcon: {
    flexShrink: 0,
  },
  boxText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
    flexShrink: 1,
  },
  boxTextCompact: {
    fontSize: 8.5,
  },
});
