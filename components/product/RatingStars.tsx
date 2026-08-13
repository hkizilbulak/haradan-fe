import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

type RatingStarsProps = {
  value: number;
  count?: number;
  size?: number;
};

/** Cartzilla yıldız + (count) */
export function RatingStars({ value, count, size = 12 }: RatingStarsProps) {
  const warning = useThemeColor('warning');
  const textMuted = useThemeColor('textMuted');
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row} accessibilityLabel={`Rating ${value} of 5`}>
      {stars.map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return (
          <Ionicons
            key={n}
            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color={filled || half ? warning : textMuted}
          />
        );
      })}
      {typeof count === 'number' ? (
        <Text style={[styles.count, { color: textMuted }]}>({count})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  count: {
    fontSize: 12,
    marginLeft: 4,
  },
});
