import React, { memo, useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAdvertLocation } from '@/services/location';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { formatViewCount } from '@/utils/formatViewCount';
import type { PublishedAdvertCard } from '@/types';
import type { AdvertId } from '@/types/advertId';
import { PriceBlock } from './PriceBlock';
import { WishlistButton } from './WishlistButton';

export type AdvertCardVariant = 'grid' | 'rail' | 'compact';

type AdvertCardProps = {
  advert: PublishedAdvertCard;
  variant?: AdvertCardVariant;
  categoryName?: string;
  onPress?: (id: AdvertId) => void;
  onToggleFavorite?: (id: AdvertId) => void;
};

function AdvertCardComponent({
  advert,
  variant = 'grid',
  categoryName,
  onPress,
  onToggleFavorite,
}: AdvertCardProps) {
  const { width } = useWindowDimensions();
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const skeleton = useThemeColor('skeleton');

  const location = useAdvertLocation(advert);

  const relative = useMemo(
    () => formatRelativeTime(advert.publishedAt),
    [advert.publishedAt]
  );

  const handlePress = useCallback(() => onPress?.(advert.id), [advert.id, onPress]);
  const handleFav = useCallback(
    () => onToggleFavorite?.(advert.id),
    [advert.id, onToggleFavorite]
  );

  const railWidth = Math.min(168, width * 0.42);
  const isFavorite = advert.isFavorite === true;

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${advert.title}, ${location}`}
        style={({ pressed }) => [
          styles.compact,
          {
            backgroundColor: surface,
            borderColor: border,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Image
          source={advert.cover?.publicUrl}
          style={[styles.compactImage, { backgroundColor: skeleton }]}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.compactBody}>
          <Text style={[styles.title, { color: text }]} numberOfLines={2}>
            {advert.title}
          </Text>
          <PriceBlock price={advert.price} />
          <View style={styles.viewRow}>
            <Ionicons name="eye-outline" size={11} color={textMuted} />
            <Text style={[styles.meta, { color: textMuted }]}>
              {formatViewCount(advert.viewCount)}
            </Text>
            <Text style={[styles.meta, { color: textMuted }]}>•</Text>
            <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${advert.title}. ${location}. ${relative}`}
      style={({ pressed }) => [
        styles.card,
        variant === 'rail' ? { width: railWidth, marginRight: Spacing.sm } : styles.gridCard,
        {
          backgroundColor: surface,
          borderColor: border,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={advert.cover?.publicUrl}
          style={[styles.image, { backgroundColor: skeleton }]}
          contentFit="cover"
          transition={200}
          recyclingKey={String(advert.id)}
        />
        <View style={styles.badgeRow}>
          {advert.isUrgent ? <Badge label="Acil" tone="danger" /> : null}
          {advert.isFeatured && !advert.isUrgent ? (
            <Badge label="Öne çıkan" tone="info" />
          ) : null}
          {advert.packageBadgeText ? (
            <Badge label={advert.packageBadgeText} tone="info" />
          ) : null}
        </View>
        <View style={styles.wishWrap}>
          <WishlistButton active={isFavorite} onPress={handleFav} />
        </View>
      </View>

      <View style={styles.body}>
        {categoryName ? (
          <Text style={[styles.category, { color: textMuted }]} numberOfLines={1}>
            {categoryName}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: text }]} numberOfLines={2}>
          {advert.title}
        </Text>
        <PriceBlock price={advert.price} />
        <View style={styles.footer}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={textMuted} />
            <Text style={[styles.meta, { color: textSecondary }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <View style={styles.metaSubRow}>
            <View style={styles.viewRow}>
              <Ionicons name="eye-outline" size={12} color={textMuted} />
              <Text style={[styles.meta, { color: textMuted }]}>
                {formatViewCount(advert.viewCount)}
              </Text>
            </View>
            <Text style={[styles.meta, { color: textMuted }]}>•</Text>
            <Text style={[styles.meta, { color: textMuted }]}>{relative}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const AdvertCard = memo(AdvertCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridCard: {
    flex: 1,
  },
  imageWrap: {
    aspectRatio: 1,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: '70%',
  },
  wishWrap: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  body: {
    padding: Spacing.sm + 4,
    gap: 4,
  },
  category: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    ...Typography.h5,
    minHeight: 40,
  },
  footer: {
    marginTop: 4,
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  meta: {
    ...Typography.caption,
    flexShrink: 1,
  },
  compact: {
    flexDirection: 'row',
    gap: Spacing.sm + 4,
    padding: Spacing.sm,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  compactImage: {
    width: 64,
    height: 64,
    borderRadius: Radius.input,
  },
  compactBody: {
    flex: 1,
    gap: 2,
  },
});
