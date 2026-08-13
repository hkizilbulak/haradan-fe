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
import type { CatalogProductCard } from '@/types';

type AdvertViewedRailProps = {
  title?: string;
  items: CatalogProductCard[];
  onPress?: (id: string) => void;
};

const GAP = Spacing.lg;

/** Son görüntülenenler — masaüstünde 4’lü sayfa slaytı. */
export const AdvertViewedRail = memo(function AdvertViewedRail({
  title = 'Son görüntülenenler',
  items,
  onPress,
}: AdvertViewedRailProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const visible = isWide ? 4 : width >= 640 ? 2 : 1;
  const gap = isWide ? GAP : Spacing.md;

  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef(0);
  const [railWidth, setRailWidth] = useState(0);
  const [page, setPage] = useState(0);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const header = useThemeColor('header');

  const list = useMemo(() => items.slice(0, 12), [items]);
  const pageCount = Math.max(1, Math.ceil(list.length / visible));

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

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (step <= 0) return;
    const p = Math.round(e.nativeEvent.contentOffset.x / step);
    pageRef.current = p;
    setPage(p);
  };

  if (list.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>{title}</Text>
        {pageCount > 1 ? (
          <Text style={[styles.pageHint, { color: textMuted }]}>
            {page + 1} / {pageCount}
          </Text>
        ) : null}
      </View>
      <View style={[styles.line, { backgroundColor: border }]} />

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

        <View
          style={styles.rail}
          onLayout={(e) => setRailWidth(e.nativeEvent.layout.width)}
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
            onMomentumScrollEnd={onMomentumEnd}
            onScrollEndDrag={onMomentumEnd}
          >
            {list.map((item) => (
              <FeaturedListingCard
                key={item.id}
                product={item}
                width={cardWidth}
                onPress={onPress}
              />
            ))}
          </ScrollView>
        </View>

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

      {pageCount > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goToPage(i)}
              hitSlop={8}
              accessibilityLabel={`Sayfa ${i + 1}`}
              style={[
                styles.dot,
                {
                  backgroundColor: i === page ? header : textMuted,
                  opacity: i === page ? 1 : 0.28,
                  width: i === page ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  pageHint: { fontSize: 12, fontWeight: '500' },
  line: { height: StyleSheet.hairlineWidth },
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
  list: { paddingVertical: 4 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
