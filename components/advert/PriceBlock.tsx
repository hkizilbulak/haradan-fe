import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import type { Money } from '@/types';

type PriceBlockProps = {
  price: Money | null;
};

export function PriceBlock({ price }: PriceBlockProps) {
  const primary = useThemeColor('primary');
  const textSecondary = useThemeColor('textSecondary');
  const hasPrice = price != null;

  return (
    <Text
      style={[
        styles.price,
        { color: hasPrice ? primary : textSecondary },
      ]}
      numberOfLines={1}
      accessibilityLabel={`Fiyat ${formatMoney(price)}`}
    >
      {formatMoney(price)}
    </Text>
  );
}

const styles = StyleSheet.create({
  price: {
    ...Typography.h5,
    fontWeight: '700',
  },
});
