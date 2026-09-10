import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAdvertLocation } from '@/services/location';
import { formatMoney } from '@/utils/formatMoney';
import { formatViewCount } from '@/utils/formatViewCount';
import { WishlistButton } from '@/components/advert/WishlistButton';
import { useListingCardAttributes } from './cardAttributes';
import type { CatalogProductCard } from '@/types';
import type { AdvertId } from '@/types/advertId';

export type UrgentListingCardVariant = 'featured' | 'row' | 'tile';

const URGENT_RED = '#e11d48';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

type UrgentListingCardProps = {
  product: CatalogProductCard;
  variant?: UrgentListingCardVariant;
  width?: number;
  active?: boolean;
  compact?: boolean;
  progressMs?: number;
  onPress?: (id: AdvertId) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
};




function UrgentListingCardComponent({
  product,
  variant = 'row',
  width,
  active = false,
  compact = false,
  progressMs = 0,
  onPress,
  onToggleFavorite,
}: UrgentListingCardProps) {
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const skeleton = useThemeColor('skeleton');
  const chipBg = useThemeColor('background');
  const fade = useRef(new Animated.Value(1)).current;
  const bar = useRef(new Animated.Value(0)).current;

  const location = useAdvertLocation(product);
  const attrs = useListingCardAttributes(product);
  const cityLabel = attrs.province || 'Türkiye';

  const views = formatViewCount(product.viewCount);

  useEffect(() => {
    if (variant !== 'featured') return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 480,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [product.id, variant, fade]);

  useEffect(() => {
    if (variant !== 'featured' || progressMs <= 0) return;
    bar.setValue(0);
    Animated.timing(bar, {
      toValue: 1,
      duration: progressMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [product.id, variant, progressMs, bar]);

  const handlePress = useCallback(
    () => onPress?.(product.id),
    [onPress, product.id]
  );
  const handleFavorite = useCallback(() => {
    onToggleFavorite?.(product);
  }, [onToggleFavorite, product]);

  if (variant === 'featured') {
    const barWidth = bar.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${product.title}, ${location}, ${views} görüntülenme`}
        style={({ pressed }) => [
          styles.featured,
          {
            opacity: pressed ? 0.97 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
            ...Platform.select({
              web: {
                cursor: 'pointer' as const,
                transition: 'transform 240ms cubic-bezier(0.22,1,0.36,1)',
              },
              default: {},
            }),
          },
        ]}
      >
        <Animated.View style={[styles.featuredInner, { opacity: fade }]}>
          <Image
            source={product.cover?.publicUrl}
            style={[styles.featuredImg, { backgroundColor: skeleton }]}
            contentFit="cover"
            transition={400}
            recyclingKey={String(product.id)}
            priority="high"
            cachePolicy="memory-disk"
          />
          <View pointerEvents="none" style={styles.featuredScrim} />
          <View style={styles.urgentPill}>
            <Text style={styles.urgentPillText}>ACİL</Text>
          </View>
          <View style={styles.wishFeatured}>
            <WishlistButton
              active={product.isFavorite === true}
              onPress={handleFavorite}
            />
          </View>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color="rgba(255,255,255,0.72)"
              />
              <Text style={styles.featuredMeta} numberOfLines={1}>
                {location}
              </Text>
            </View>
            <View style={styles.featuredBottom}>
              <Text style={styles.featuredPrice}>
                {formatMoney(product.price)}
              </Text>
            </View>
          </View>
        </Animated.View>
        {progressMs > 0 ? (
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  if (variant === 'tile') {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${product.title}, ${cityLabel}`}
        style={({ pressed }) => [
          styles.tile,
          width ? { width } : null,
          { backgroundColor: surface, borderColor: border },
          pressed && { opacity: 0.94 },
          Platform.select({
            web: {
              cursor: 'pointer' as const,
              boxShadow: '0 4px 18px -2px rgba(15, 23, 42, 0.05)',
            },
            default: {},
          }),
        ]}
      >
        <View style={styles.tileImageWrap}>
          <Image
            source={product.cover?.publicUrl}
            style={[styles.tileImage, { backgroundColor: skeleton }]}
            contentFit="cover"
            transition={220}
            recyclingKey={String(product.id)}
            priority="low"
            cachePolicy="memory-disk"
          />
          <View style={styles.tileUrgent}>
            <View style={styles.tileUrgentDot} />
            <Text style={styles.tileUrgentText}>ACİL</Text>
          </View>
          <View style={styles.tileWish}>
            <WishlistButton
              size="sm"
              variant="circle"
              active={product.isFavorite === true}
              onPress={handleFavorite}
            />
          </View>
        </View>
        <View style={styles.tileBody}>
          <Text style={[styles.tileTitle, { color: text }]} numberOfLines={2}>
            {product.title}
          </Text>
          {/* 2. Fiyat (solda), Dikey Çizgi ve İl (sağda) */}
          <View style={styles.tilePriceLocationRow}>
            <Text style={[styles.tilePrice, { color: text }]} numberOfLines={1}>
              {formatMoney(product.price)}
            </Text>
            <View style={[styles.tilePriceLocationDivider, { backgroundColor: border }]} />
            <View style={styles.tileLocationWrap}>
              <Ionicons name="location-outline" size={13} color={textSecondary} />
              <Text style={[styles.tileMeta, { color: textSecondary }]} numberOfLines={1}>
                {cityLabel}
              </Text>
            </View>
          </View>

          {/* 3. Cinsiyet, Yaş, Irk, Boy kutucukları (İkonlu) */}
          {attrs.serviceCategory ? (
            <View style={styles.tileBoxesRow}>
              <View style={[styles.tileBoxItem, { backgroundColor: chipBg }]}>
                <Ionicons
                  name="briefcase-outline"
                  size={12}
                  color={textSecondary}
                  style={styles.tileBoxIcon}
                />
                <Text style={[styles.tileBoxText, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.serviceCategory}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.tileBoxesRow}>
              {/* Kutucuk 1: Cinsiyet */}
              <View style={[styles.tileBoxItem, { backgroundColor: chipBg }]}>
                <Ionicons
                  name={
                    attrs.gender === 'Dişi'
                      ? 'female'
                      : attrs.gender === 'İğdiş'
                        ? 'male-female'
                        : 'male'
                  }
                  size={12}
                  color={textSecondary}
                  style={styles.tileBoxIcon}
                />
                <Text style={[styles.tileBoxText, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.gender || 'Erkek'}
                </Text>
              </View>

              {/* Kutucuk 2: Yaş */}
              <View style={[styles.tileBoxItem, { backgroundColor: chipBg }]}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={textSecondary}
                  style={styles.tileBoxIcon}
                />
                <Text style={[styles.tileBoxText, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.age || '4 yaş'}
                </Text>
              </View>

              {/* Kutucuk 3: Irk */}
              <View style={[styles.tileBoxItem, { backgroundColor: chipBg }]}>
                <FontAwesome5
                  name="horse-head"
                  size={11}
                  color={textSecondary}
                  style={styles.tileBoxIcon}
                />
                <Text style={[styles.tileBoxText, { color: textSecondary }]} numberOfLines={1}>
                  {attrs.breed || 'Arap'}
                </Text>
              </View>

              {/* Kutucuk 4: Boy / Cidago (Varsa) */}
              {attrs.height ? (
                <View style={[styles.tileBoxItem, { backgroundColor: chipBg }]}>
                  <MaterialCommunityIcons
                    name="ruler"
                    size={12}
                    color={textSecondary}
                    style={styles.tileBoxIcon}
                  />
                  <Text style={[styles.tileBoxText, { color: textSecondary }]} numberOfLines={1}>
                    {attrs.height}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${product.title}, ${location}, ${views} görüntülenme`}
      style={({ pressed }) => [
        styles.row,
        compact && styles.rowCompact,
        active && styles.rowActive,
        {
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.994 : 1 }],
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition:
                'transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease',
            },
            default: {},
          }),
        },
      ]}
    >
      <View style={[styles.thumbWrap, compact && styles.thumbWrapCompact]}>
        <Image
          source={product.cover?.publicUrl}
          style={[styles.thumb, { backgroundColor: skeleton }]}
          contentFit="cover"
          transition={220}
          recyclingKey={String(product.id)}
          priority="low"
          cachePolicy="memory-disk"
        />
        <View style={styles.urgentMini}>
          <Text style={styles.urgentMiniText}>ACİL</Text>
        </View>
        <View style={styles.wishRow}>
          <WishlistButton
            size="sm"
            active={product.isFavorite === true}
            onPress={handleFavorite}
          />
        </View>
      </View>
      <View style={[styles.rowBody, compact && styles.rowBodyCompact]}>
        <Text
          style={[styles.rowTitle, compact && styles.rowTitleCompact, { color: text }]}
          numberOfLines={2}
        >
          {product.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={textMuted} />
          <Text style={[styles.rowMeta, { color: textMuted }]} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.rowFooter}>
          <Text style={[styles.rowPrice, compact && styles.rowPriceCompact, { color: text }]}>
            {formatMoney(product.price)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const UrgentListingCard = memo(UrgentListingCardComponent);

const styles = StyleSheet.create({
  featured: {
    flex: 1,
    minHeight: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111113',
  },
  featuredInner: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredImg: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    backgroundColor: 'rgba(12,12,14,0.55)',
  },
  urgentPill: {
    position: 'absolute',
    top: 18,
    left: 18,
    backgroundColor: URGENT_RED,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  urgentPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  wishFeatured: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  wishRow: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  featuredCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
    gap: 8,
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  featuredMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    flexShrink: 1,
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: 6,
  },
  featuredPrice: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 10,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: URGENT_RED,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  rowCompact: {
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 14,
  },
  rowActive: {
    backgroundColor: 'rgba(15,23,42,0.04)',
  },
  thumbWrap: {
    width: 92,
    height: 92,
    borderRadius: 22,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbWrapCompact: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  urgentMini: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: URGENT_RED,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  urgentMiniText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  rowBodyCompact: {
    gap: 3,
  },
  rowTitle: {
    ...Typography.small,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  rowTitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowMeta: {
    ...Typography.caption,
    flexShrink: 1,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 2,
  },
  rowPrice: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  rowPriceCompact: {
    fontSize: 13,
  },
  viewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowViews: {
    ...Typography.caption,
    fontWeight: '500',
  },
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'transform 240ms ease, box-shadow 240ms ease',
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
  tileImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileUrgent: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: URGENT_RED,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
    zIndex: 2,
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
  tileUrgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  tileUrgentText: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  tileWish: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  tileBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 4,
  },
  tileTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  tilePriceLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  tileLocationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  tilePriceLocationDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 8,
    opacity: 0.8,
  },
  tileMeta: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  tilePrice: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 0,
  },
  tileBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 4,
  },
  tileBoxItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 3,
  },
  tileBoxIcon: {
    flexShrink: 0,
  },
  tileBoxText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
    flexShrink: 1,
  },
});
