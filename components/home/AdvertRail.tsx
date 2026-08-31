import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AdvertCard } from '@/components/advert';
import { Spacing } from '@/constants/Spacing';
import type { PublishedAdvertCard } from '@/types'
import type { AdvertId } from '@/types/advertId';
import { SectionHeader } from './SectionHeader';

type AdvertRailProps = {
  title: string;
  adverts: PublishedAdvertCard[];
  categoryNameById?: Record<string, string>;
  onViewAll?: () => void;
  onAdvertPress?: (id: AdvertId) => void;
  onToggleFavorite?: (id: AdvertId) => void;
};

/**
 * Yatay ilan şeridi.
 * Ana sayfa ScrollView içinde olduğu için FlatList yerine map kullanılır
 * (nested VirtualizedList uyarısını önler; rail ≤ ~12 öğe).
 */
export function AdvertRail({
  title,
  adverts,
  categoryNameById,
  onViewAll,
  onAdvertPress,
  onToggleFavorite,
}: AdvertRailProps) {
  if (adverts.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} onActionPress={onViewAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        decelerationRate="fast"
      >
        {adverts.map((item) => (
          <AdvertCard
            key={item.id}
            advert={item}
            variant="rail"
            categoryName={categoryNameById?.[item.categoryId]}
            onPress={onAdvertPress}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
});
