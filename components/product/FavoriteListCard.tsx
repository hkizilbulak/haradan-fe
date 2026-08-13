import React, { memo, useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup } from '@/services/location/LocationLookup';
import { formatMoney } from '@/utils/formatMoney';
import type { CatalogProductCard } from '@/types';

type FavoriteListCardProps = {
  product: CatalogProductCard;
  onPress?: (id: string) => void;
  onRemove?: (id: string) => void;
};

function FavoriteListCardComponent({
  product,
  onPress,
  onRemove,
}: FavoriteListCardProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const skeleton = useThemeColor('skeleton');
  const [hovered, setHovered] = useState(false);

  const location = [
    locationLookup.getDistrictName(product.districtId),
    locationLookup.getProvinceName(product.provinceId),
  ]
    .filter(Boolean)
    .join(', ');

  const handlePress = useCallback(
    () => onPress?.(product.id),
    [onPress, product.id]
  );
  const handleRemove = useCallback(
    () => onRemove?.(product.id),
    [onRemove, product.id]
  );

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={product.title}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: hovered || pressed ? 'rgba(12,12,14,0.035)' : 'transparent',
          opacity: pressed ? 0.92 : 1,
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition: 'background-color 220ms cubic-bezier(0.22,1,0.36,1)',
            },
            default: {},
          }),
        },
      ]}
    >
      <Image
        source={product.cover?.publicUrl}
        style={[styles.image, { backgroundColor: skeleton }]}
        contentFit="cover"
        transition={220}
        recyclingKey={product.id}
      />
      <View style={styles.body}>
        <Text style={[styles.title, { color: text }]} numberOfLines={2}>
          {product.title}
        </Text>
        {location ? (
          <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
        <Text style={[styles.price, { color: text }]} numberOfLines={1}>
          {formatMoney(product.price)}
        </Text>
      </View>
      <Pressable
        onPress={handleRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Favorilerden çıkar"
        style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.4 : 0.7 }]}
      >
        <Ionicons name="heart" size={18} color="#0c0c0e" />
      </Pressable>
    </Pressable>
  );
}

export const FavoriteListCard = memo(FavoriteListCardComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 22,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 22,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    ...Typography.small,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  meta: {
    ...Typography.caption,
    fontSize: 12,
  },
  price: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
