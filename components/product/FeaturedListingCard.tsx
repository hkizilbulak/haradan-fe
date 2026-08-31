import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useMediaImageSource } from '@/hooks/useMediaImageSource';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAdvertLocation } from '@/services/location';
import { formatMoney } from '@/utils/formatMoney';
import { formatViewCount } from '@/utils/formatViewCount';
import { WishlistButton } from '@/components/advert/WishlistButton';
import { RemoveDraftButton } from '@/components/advert/RemoveDraftButton';
import { MarkSoldButton } from '@/components/advert/MarkSoldButton';
import { SoldOverlay } from '@/components/advert/SoldOverlay';
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
  onRemove,
  removing = false,
  onMarkSold,
  markingSold = false,
}: FeaturedListingCardProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const skeleton = useThemeColor('skeleton');
  const hover = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

  const location = useAdvertLocation(product);

  const views = formatViewCount(product.viewCount);
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
    outputRange: [0, -6],
  });
  const cardScale = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });
  const imgScale = hover.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => animateHover(1)}
      onHoverOut={() => animateHover(0)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${location}, ${views} görüntülenme`}
      {...(Platform.OS === 'web'
        ? ({ dataSet: { keepSearch: 'true' } } as object)
        : null)}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        width ? { width } : null,
        {
          opacity: pressed ? 0.94 : 1,
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
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
            transform: [{ translateY: lift }, { scale: cardScale }],
            backgroundColor: hovered ? '#fff' : 'transparent',
            ...Platform.select({
              web: {
                boxShadow: hovered
                  ? '0 22px 48px rgba(12,12,14,0.10), 0 2px 8px rgba(12,12,14,0.04)'
                  : '0 0 0 rgba(0,0,0,0)',
                transition:
                  'box-shadow 320ms cubic-bezier(0.22,1,0.36,1), background-color 320ms cubic-bezier(0.22,1,0.36,1)',
              },
              default: {},
            }),
          },
        ]}
      >
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
          {resolvedBadge === 'urgent' ? (
            <View style={[styles.pill, styles.urgentPill, compact && styles.pillCompact]}>
              <Text style={[styles.urgentText, compact && styles.urgentTextCompact]}>
                ACİL
              </Text>
            </View>
          ) : null}
          {resolvedBadge === 'featured' ? (
            <View style={[styles.pill, styles.featuredPill, compact && styles.pillCompact]}>
              <Ionicons name="star" size={compact ? 8 : 10} color="#fff" />
              <Text style={[styles.featuredText, compact && styles.featuredTextCompact]}>
                Öne çıkan
              </Text>
            </View>
          ) : null}
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
            <WishlistButton
              active={product.isFavorite === true}
              onPress={handleFavorite}
            />
          </View>
        </View>

        <View style={[styles.body, compact && styles.bodyCompact]}>
          <Text
            style={[styles.title, compact && styles.titleCompact, { color: text }]}
            numberOfLines={2}
          >
            {product.title}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={compact ? 11 : 13} color={textMuted} />
            <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <View style={styles.footer}>
            <Text style={[styles.price, compact && styles.priceCompact, { color: text }]}>
              {formatMoney(product.price)}
            </Text>
            <View style={styles.views}>
              <Ionicons name="eye-outline" size={compact ? 11 : 13} color={textMuted} />
              <Text style={[styles.viewText, { color: textMuted }]}>{views}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const FeaturedListingCard = memo(FeaturedListingCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
  },
  cardCompact: {},
  motion: {
    gap: 12,
    borderRadius: 36,
    padding: 8,
    margin: -8,
  },
  motionCompact: {
    gap: 8,
    borderRadius: 18,
    padding: 4,
    margin: -4,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  imageWrapCompact: {
    aspectRatio: 4 / 3,
    borderRadius: 14,
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
    backgroundColor: 'rgba(12,12,14,0.08)',
    ...Platform.select({
      web: {
        transition: 'opacity 320ms cubic-bezier(0.22,1,0.36,1)',
      },
      default: {},
    }),
  },
  pill: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillCompact: {
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  urgentPill: {
    backgroundColor: URGENT_RED,
  },
  urgentText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  urgentTextCompact: {
    fontSize: 7,
    letterSpacing: 0.8,
  },
  featuredPill: {
    backgroundColor: FEATURED_INK,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  featuredTextCompact: {
    fontSize: 7,
  },
  wishWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  body: {
    gap: 6,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  bodyCompact: {
    gap: 4,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  title: {
    ...Typography.small,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.2,
    minHeight: 38,
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    ...Typography.caption,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.25,
    flexShrink: 1,
  },
  priceCompact: {
    fontSize: 13,
  },
  views: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  viewText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
