import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdvertCard } from '@/components/advert';
import { Spacing } from '@/constants/Spacing';
import type { PublishedAdvertCard } from '@/types'
import type { AdvertId } from '@/types/advertId';
import { SectionHeader } from './SectionHeader';

type NewArrivalsCompactProps = {
  adverts: PublishedAdvertCard[];
  onViewAll?: () => void;
  onAdvertPress?: (id: AdvertId) => void;
  maxItems?: number;
};

/** Canvas New Arrivals — kompakt liste (mobil first). */
export function NewArrivalsCompact({
  adverts,
  onViewAll,
  onAdvertPress,
  maxItems = 6,
}: NewArrivalsCompactProps) {
  const items = useMemo(() => adverts.slice(0, maxItems), [adverts, maxItems]);

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Yeni ilanlar" onActionPress={onViewAll} />
      <View style={styles.list}>
        {items.map((advert) => (
          <AdvertCard
            key={advert.id}
            advert={advert}
            variant="compact"
            onPress={onAdvertPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  list: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
});
