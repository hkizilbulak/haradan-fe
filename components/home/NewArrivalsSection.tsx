import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { UrgentListingCard } from '@/components/product/UrgentListingCard';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import type { CatalogProductCard } from '@/types';
import { SectionHeader } from './SectionHeader';

type NewArrivalsSectionProps = {
  products: CatalogProductCard[];
  onProductPress?: (id: string) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
  onViewAll?: () => void;
};

const ROTATE_MS = 8000;

/**
 * Acil Satılık İlanlar — listedeki kartlar büyük alanda sırayla döner.
 */
export const NewArrivalsSection = memo(function NewArrivalsSection({
  products,
  onProductPress,
  onToggleFavorite,
  onViewAll,
}: NewArrivalsSectionProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const paused = useRef(false);

  const items = useMemo(() => {
    const urgent = products.filter((p) => p.isUrgent);
    const source = urgent.length > 0 ? urgent : products;
    return source.slice(0, 6);
  }, [products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const featured = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (paused.current) return;
      setActiveIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  const columns = useMemo(() => {
    const left: CatalogProductCard[] = [];
    const right: CatalogProductCard[] = [];
    items.forEach((p, i) => (i % 2 === 0 ? left : right).push(p));
    return [left, right] as const;
  }, [items]);

  const onSelectItem = useCallback((id: string) => {
    const next = items.findIndex((p) => p.id === id);
    if (next >= 0) setActiveIndex(next);
  }, [items]);

  const onRowPress = useCallback(
    (id: string) => {
      onSelectItem(id);
      onProductPress?.(id);
    },
    [onSelectItem, onProductPress]
  );

  const pause = useCallback(() => {
    paused.current = true;
  }, []);
  const resume = useCallback(() => {
    paused.current = false;
  }, []);

  if (!featured) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Acil Satılık İlanlar"
        actionLabel="Tümünü gör"
        onActionPress={onViewAll}
      />
      <View style={[styles.row, !isWide && styles.rowMobile]}>
        <Pressable
          onHoverIn={pause}
          onHoverOut={resume}
          style={[styles.featured, !isWide && styles.featuredMobile]}
        >
          <UrgentListingCard
            product={featured}
            variant="featured"
            progressMs={items.length > 1 ? ROTATE_MS : 0}
            onPress={onProductPress}
            onToggleFavorite={onToggleFavorite}
          />
        </Pressable>
        <View style={[styles.list, !isWide && styles.listMobile]}>
          {isWide ? (
            <>
              <View style={styles.col}>
                {columns[0].map((p) => (
                  <UrgentListingCard
                    key={p.id}
                    product={p}
                    variant="row"
                    active={p.id === featured.id}
                    onPress={onRowPress}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </View>
              <View style={styles.col}>
                {columns[1].map((p) => (
                  <UrgentListingCard
                    key={p.id}
                    product={p}
                    variant="row"
                    active={p.id === featured.id}
                    onPress={onRowPress}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </View>
            </>
          ) : (
            items.map((p) => (
              <UrgentListingCard
                key={p.id}
                product={p}
                variant="row"
                active={p.id === featured.id}
                onPress={onRowPress}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  row: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'stretch',
  },
  rowMobile: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  featured: {
    width: '36%',
    minWidth: 260,
    minHeight: 420,
  },
  featuredMobile: {
    width: '100%',
    minHeight: 320,
  },
  list: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  listMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  col: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
});
