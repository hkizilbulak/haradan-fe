import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AdvertCard } from '@/components/advert';
import { Spacing } from '@/constants/Spacing';
import type { PublishedAdvertCard } from '@/types';
import type { AdvertId } from '@/types/advertId';
import { SectionHeader } from './SectionHeader';

type AdvertGridSectionProps = {
  title: string;
  adverts: PublishedAdvertCard[];
  categoryNameById?: Record<string, string>;
  onViewAll?: () => void;
  onAdvertPress?: (id: AdvertId) => void;
  onToggleFavorite?: (id: AdvertId) => void;
  /** Mobil first: varsayılan 2 kolon */
  maxItems?: number;
};

export function AdvertGridSection({
  title,
  adverts,
  categoryNameById,
  onViewAll,
  onAdvertPress,
  onToggleFavorite,
  maxItems = 6,
}: AdvertGridSectionProps) {
  const { width } = useWindowDimensions();
  const gap = Spacing.sm;
  const pad = Spacing.md;
  const colWidth = (width - pad * 2 - gap) / 2;

  const rows = useMemo(() => {
    const items = adverts.slice(0, maxItems);
    const pairs: PublishedAdvertCard[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push(items.slice(i, i + 2));
    }
    return pairs;
  }, [adverts, maxItems]);

  const renderCard = useCallback(
    (item: PublishedAdvertCard) => (
      <View key={item.id} style={{ width: colWidth }}>
        <AdvertCard
          advert={item}
          variant="grid"
          categoryName={categoryNameById?.[item.categoryId]}
          onPress={onAdvertPress}
          onToggleFavorite={onToggleFavorite}
        />
      </View>
    ),
    [categoryNameById, colWidth, onAdvertPress, onToggleFavorite]
  );

  if (adverts.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} onActionPress={onViewAll} />
      <View style={styles.grid}>
        {rows.map((pair, rowIndex) => (
          <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
            {pair.map(renderCard)}
            {pair.length === 1 ? <View style={{ width: colWidth }} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  grid: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
});
