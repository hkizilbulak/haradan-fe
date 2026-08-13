import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CatalogProductCard } from '@/types';
import { PriceBlock } from './PriceBlock';
import { RatingStars } from './RatingStars';

export type ProductCardVariant = 'compact' | 'trending' | 'offer';

type ProductCardProps = {
  product: CatalogProductCard;
  variant?: ProductCardVariant;
  width?: number;
  onPress?: (id: string) => void;
  onAddToCart?: (id: string) => void;
};

function ProductCardComponent({
  product,
  variant = 'trending',
  width,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const skeleton = useThemeColor('skeleton');
  const surface = useThemeColor('surface');
  const textMuted = useThemeColor('textMuted');
  const primary = useThemeColor('primary');

  const handlePress = useCallback(() => onPress?.(product.id), [onPress, product.id]);
  const handleCart = useCallback(() => onAddToCart?.(product.id), [onAddToCart, product.id]);

  const badgeTone =
    product.packageBadgeText?.startsWith('-') || product.packageBadgeText?.includes('%')
      ? ('danger' as const)
      : ('info' as const);

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={product.title}
        style={({ pressed }) => [styles.compact, { opacity: pressed ? 0.92 : 1 }]}
      >
        <Image
          source={product.cover?.publicUrl}
          style={[styles.compactImg, { backgroundColor: skeleton }]}
          contentFit="contain"
          transition={200}
        />
        <View style={styles.compactBody}>
          <RatingStars value={product.rating} count={product.reviewCount} />
          <Text style={[styles.compactTitle, { color: text }]} numberOfLines={2}>
            {product.title}
          </Text>
          <PriceBlock price={product.price} oldPrice={product.oldPrice} size="sm" />
        </View>
      </Pressable>
    );
  }

  const stockTotal = 120;
  const available = product.available ?? 0;
  const stockPct = Math.max(0.08, Math.min(1, available / stockTotal));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={product.title}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : null,
        { opacity: pressed ? 0.96 : 1 },
      ]}
    >
      <View style={[styles.imageWrap, { backgroundColor: surface, borderColor: border }]}>
        <Image
          source={product.cover?.publicUrl}
          style={[styles.image, { backgroundColor: skeleton }]}
          contentFit="contain"
          transition={200}
          recyclingKey={product.id}
        />
        {product.packageBadgeText ? (
          <View style={styles.badge}>
            <Badge label={product.packageBadgeText} tone={badgeTone} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <RatingStars value={product.rating} count={product.reviewCount} />
        <Text style={[styles.title, { color: text }]} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceGrow}>
            <PriceBlock price={product.price} oldPrice={product.oldPrice} />
          </View>
          <Pressable
            onPress={handleCart}
            accessibilityRole="button"
            accessibilityLabel="Add to cart"
            hitSlop={6}
            style={({ pressed }) => [
              styles.cartBtn,
              { backgroundColor: border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="cart-outline" size={16} color={text} />
          </Pressable>
        </View>

        {variant === 'offer' && product.available != null ? (
          <View style={styles.stock}>
            <View style={[styles.stockTrack, { backgroundColor: border }]}>
              <View
                style={[
                  styles.stockFill,
                  {
                    width: `${Math.round(stockPct * 100)}%`,
                    backgroundColor: primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.stockLabel, { color: textMuted }]}>
              Available: {available}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  imageWrap: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  body: { gap: 6 },
  title: { ...Typography.h5, minHeight: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priceGrow: { flex: 1 },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stock: { marginTop: 4, gap: 4 },
  stockTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  stockFill: { height: '100%', borderRadius: 2 },
  stockLabel: { ...Typography.caption },
  compact: {
    flexDirection: 'row',
    gap: Spacing.sm + 4,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  compactImg: { width: 72, height: 72, borderRadius: Radius.input },
  compactBody: { flex: 1, gap: 4 },
  compactTitle: { ...Typography.small, fontWeight: '600' },
});
