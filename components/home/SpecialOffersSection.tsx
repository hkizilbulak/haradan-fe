import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedListingCard } from '@/components/product/FeaturedListingCard';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CatalogProductCard } from '@/types'
import type { AdvertId } from '@/types/advertId';

type SpecialOffersSectionProps = {
  products: CatalogProductCard[];
  onViewAll?: () => void;
  onProductPress?: (id: AdvertId) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
};

const ROTATE_MS = 7000;
const GAP = Spacing.lg;

/** Senin için seçtiklerimiz — 4’lü sayfalar, süreli slider. */
export const SpecialOffersSection = memo(function SpecialOffersSection({
  products,
  onViewAll,
  onProductPress,
  onToggleFavorite,
}: SpecialOffersSectionProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const visible = isWide ? 4 : 2;
  const gap = isWide ? GAP : Spacing.md;

  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef(0);
  const hoverPaused = useRef(false);
  const dragPaused = useRef(false);

  const [railWidth, setRailWidth] = useState(0);
  const [page, setPage] = useState(0);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');

  const items = useMemo(() => products.slice(0, 12), [products]);
  const pageCount = Math.max(1, Math.ceil(items.length / visible));

  const cardWidth = useMemo(() => {
    if (railWidth <= 0) return isWide ? 240 : Math.min(220, width * 0.78);
    return Math.floor((railWidth - gap * (visible - 1)) / visible);
  }, [railWidth, gap, visible, isWide, width]);

  const step = visible * (cardWidth + gap);

  const goToPage = useCallback(
    (next: number, animated = true) => {
      if (pageCount < 1 || step <= 0) return;
      const p = ((next % pageCount) + pageCount) % pageCount;
      pageRef.current = p;
      setPage(p);
      scrollRef.current?.scrollTo({ x: p * step, animated });
    },
    [pageCount, step]
  );

  useEffect(() => {
    goToPage(pageRef.current, false);
  }, [step, goToPage]);

  useEffect(() => {
    if (pageCount < 2 || step <= 0) return;
    const timer = setInterval(() => {
      if (hoverPaused.current || dragPaused.current) return;
      goToPage(pageRef.current + 1);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [pageCount, step, goToPage]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragPaused.current = false;
    if (step <= 0) return;
    const p = Math.round(e.nativeEvent.contentOffset.x / step);
    pageRef.current = p;
    setPage(p);
  };

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>
          Senin için seçtiklerimiz
        </Text>
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel="Tümünü gör"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.viewAll, { color: textMuted }]}>Tümünü gör</Text>
        </Pressable>
      </View>

      <View style={styles.railWrap}>
        {isWide && pageCount > 1 ? (
          <Pressable
            onPress={() => goToPage(page - 1)}
            accessibilityRole="button"
            accessibilityLabel="Önceki"
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: header, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={16} color="#fff" />
          </Pressable>
        ) : null}

        <Pressable
          style={styles.rail}
          onLayout={(e) => setRailWidth(e.nativeEvent.layout.width)}
          onHoverIn={() => {
            hoverPaused.current = true;
          }}
          onHoverOut={() => {
            hoverPaused.current = false;
          }}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.list, { gap }]}
            decelerationRate="fast"
            snapToInterval={step}
            snapToAlignment="start"
            disableIntervalMomentum
            onScrollBeginDrag={() => {
              dragPaused.current = true;
            }}
            onMomentumScrollEnd={onMomentumEnd}
            onScrollEndDrag={onMomentumEnd}
          >
            {items.map((p) => (
              <FeaturedListingCard
                key={p.id}
                product={p}
                width={cardWidth}
                compact={!isWide}
                onPress={onProductPress}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </ScrollView>
        </Pressable>

        {isWide && pageCount > 1 ? (
          <Pressable
            onPress={() => goToPage(page + 1)}
            accessibilityRole="button"
            accessibilityLabel="Sonraki"
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: header, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    flex: 1,
  },
  viewAll: { fontSize: 13, fontWeight: '600' },
  railWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rail: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  list: { paddingVertical: 2 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
