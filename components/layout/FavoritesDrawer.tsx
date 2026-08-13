import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteListCard } from '@/components/product/FavoriteListCard';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CatalogProductCard } from '@/types';

type FavoritesDrawerProps = {
  items: CatalogProductCard[];
  onItemPress?: (id: string) => void;
  onRemove?: (id: string) => void;
};

/** Favori çekmece içeriği — kabuk SideDrawer. */
export function FavoritesDrawer({
  items,
  onItemPress,
  onRemove,
}: FavoritesDrawerProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="heart-outline" size={28} color={textMuted} />
        <Text style={[styles.emptyTitle, { color: text }]}>
          Henüz favori yok
        </Text>
        <Text style={[styles.emptyDesc, { color: textMuted }]}>
          Beğendiğiniz ilanı kalple kaydedin.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {items.map((item) => (
        <FavoriteListCard
          key={item.id}
          product={item}
          onPress={onItemPress}
          onRemove={onRemove}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 8,
    paddingBottom: Spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  emptyTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 220,
  },
});
