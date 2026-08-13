import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import type { Money } from '@/types';

type PriceBlockProps = {
  price: Money | null;
  oldPrice?: Money | null;
  size?: 'sm' | 'md';
};

export function PriceBlock({ price, oldPrice, size = 'md' }: PriceBlockProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');

  return (
    <View style={styles.row}>
      <Text
        style={[
          size === 'sm' ? styles.priceSm : styles.price,
          { color: text },
        ]}
        numberOfLines={1}
      >
        {formatMoney(price)}
      </Text>
      {oldPrice ? (
        <Text style={[styles.old, { color: textMuted }]} numberOfLines={1}>
          {formatMoney(oldPrice)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    ...Typography.h5,
    fontWeight: '700',
  },
  priceSm: {
    fontSize: 14,
    fontWeight: '700',
  },
  old: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
});
