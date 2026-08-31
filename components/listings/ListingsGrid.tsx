import React, { memo, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedListingCard } from '@/components/product/FeaturedListingCard';
import {
  HOME_CONTENT_MAX_WIDTH,
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CatalogProductCard } from '@/types'
import type { AdvertId } from '@/types/advertId';

const PAGE_SIZE = 9; // 3 × 3

type ListingsGridProps = {
  items: CatalogProductCard[];
  page: number;
  onPageChange: (page: number) => void;
  onProductPress?: (id: AdvertId) => void;
  onToggleFavorite?: (product: CatalogProductCard) => void;
  /** Mobil Ara — 2 kolon kompakt kartlar. */
  compact?: boolean;
};

/** Sağ panel — 3 kolon kart grid + sayfalama. */
export const ListingsGrid = memo(function ListingsGrid({
  items,
  page,
  onPageChange,
  onProductPress,
  onToggleFavorite,
  compact = false,
}: ListingsGridProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const cols = compact ? 2 : isWide ? 3 : width >= 640 ? 2 : 1;
  const gap = compact ? Spacing.sm : isWide ? Spacing.lg : Spacing.md;
  const pad = homeContentPadding(isWide);

  // Sidebar ~280 + gap; grid uses remaining of content width when parent is flex
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  const slice = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  const [railWidth, setRailWidth] = useState(0);
  const colWidth = useMemo(() => {
    if (railWidth <= 0) {
      const fallback =
        Math.min(width, HOME_CONTENT_MAX_WIDTH) - pad * 2 - (isWide ? 272 : 0);
      return Math.floor((fallback - gap * (cols - 1)) / cols);
    }
    return Math.floor((railWidth - gap * (cols - 1)) / cols);
  }, [railWidth, gap, cols, width, pad, isWide]);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: border, backgroundColor: surface }]}>
        <Ionicons name="search-outline" size={28} color={textMuted} />
        <Text style={[styles.emptyTitle, { color: text }]}>
          Sonuç bulunamadı
        </Text>
        <Text style={[styles.emptyHint, { color: textMuted }]}>
          Filtreleri değiştirerek tekrar deneyin.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.grid, { gap }]}
        onLayout={(e) => setRailWidth(e.nativeEvent.layout.width)}
      >
        {slice.map((p) => (
          <FeaturedListingCard
            key={p.id}
            product={p}
            width={colWidth}
            compact={compact}
            badge={p.isUrgent ? 'urgent' : 'auto'}
            onPress={onProductPress}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </View>

      {pageCount > 1 ? (
        <View
          nativeID="haradan-listings-pager"
          style={styles.pager}
          {...(Platform.OS === 'web'
            ? ({ dataSet: { keepSearch: 'true' } } as object)
            : null)}
        >
          <Pressable
            onPress={() => onPageChange(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            style={({ pressed }) => [
              styles.pageBtn,
              {
                borderColor: border,
                opacity: safePage === 0 ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
            accessibilityLabel="Önceki sayfa"
          >
            <Ionicons name="chevron-back" size={16} color={text} />
          </Pressable>

          <View style={styles.pages}>
            {Array.from({ length: pageCount }).map((_, i) => {
              const active = i === safePage;
              return (
                <Pressable
                  key={i}
                  onPress={() => onPageChange(i)}
                  style={[
                    styles.pageDot,
                    {
                      backgroundColor: active ? header : border,
                      width: active ? 22 : 8,
                    },
                  ]}
                  accessibilityLabel={`Sayfa ${i + 1}`}
                />
              );
            })}
          </View>

          <Text style={[styles.pageLabel, { color: textMuted }]}>
            {safePage + 1} / {pageCount}
          </Text>

          <Pressable
            onPress={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            style={({ pressed }) => [
              styles.pageBtn,
              {
                borderColor: border,
                opacity:
                  safePage >= pageCount - 1 ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
            accessibilityLabel="Sonraki sayfa"
          >
            <Ionicons name="chevron-forward" size={16} color={text} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

export const LISTINGS_PAGE_SIZE = PAGE_SIZE;

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing.xl, minWidth: 0 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  empty: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyHint: { fontSize: 13, fontWeight: '400' },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pages: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageDot: { height: 8, borderRadius: 4 },
  pageLabel: { fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'center' },
});
