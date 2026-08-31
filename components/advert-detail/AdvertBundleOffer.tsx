import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAdvertLocation } from '@/services/location';
import { formatMoney } from '@/utils/formatMoney';
import { formatViewCount } from '@/utils/formatViewCount';
import type { CatalogProductCard } from '@/types';
import type { AdvertId } from '@/types/advertId';

type AdvertBundleOfferProps = {
  title?: string;
  items: CatalogProductCard[];
  onPress?: (id: AdvertId) => void;
  onViewAll?: () => void;
};

const ROTATE_MS = 6500;
const GAP = Spacing.lg;
const URGENT = '#e11d48';

/**
 * Öne çıkan ilanlar — 3’lü sayfa slaytı, premium çerçevesiz kartlar.
 */
export const AdvertBundleOffer = memo(function AdvertBundleOffer({
  title = 'Öne çıkan ilanlar',
  items,
  onPress,
  onViewAll,
}: AdvertBundleOfferProps) {
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const visible = isWide ? 3 : width >= 640 ? 2 : 1;
  const gap = isWide ? GAP : Spacing.md;

  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef(0);
  const hoverPaused = useRef(false);
  const dragPaused = useRef(false);

  const [railWidth, setRailWidth] = useState(0);
  const [page, setPage] = useState(0);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');
  const skeleton = useThemeColor('skeleton');

  const list = useMemo(() => items.slice(0, 9), [items]);
  const pageCount = Math.max(1, Math.ceil(list.length / visible));

  const cardWidth = useMemo(() => {
    if (railWidth <= 0) {
      return isWide ? 280 : Math.min(260, width * 0.82);
    }
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

  if (list.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: textMuted }]}>Keşfet</Text>
          <Text style={[styles.title, { color: text }]}>{title}</Text>
        </View>
        {onViewAll ? (
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="Tümünü gör"
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          >
            <Text style={[styles.viewAll, { color: textMuted }]}>Tümünü gör</Text>
          </Pressable>
        ) : null}
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
            {list.map((item) => (
              <FeaturedSlideCard
                key={item.id}
                product={item}
                width={cardWidth}
                onPress={onPress}
                text={text}
                textMuted={textMuted}
                textSecondary={textSecondary}
                skeleton={skeleton}
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

      {pageCount > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goToPage(i)}
              accessibilityRole="button"
              accessibilityLabel={`Sayfa ${i + 1}`}
              hitSlop={8}
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

const FeaturedSlideCard = memo(function FeaturedSlideCard({
  product,
  width,
  onPress,
  text,
  textMuted,
  textSecondary,
  skeleton,
}: {
  product: CatalogProductCard;
  width: number;
  onPress?: (id: AdvertId) => void;
  text: string;
  textMuted: string;
  textSecondary: string;
  skeleton: string;
}) {
  const location = useAdvertLocation(product);

  const views = formatViewCount(product.viewCount);
  const breed = product.brand;

  return (
    <Pressable
      onPress={() => onPress?.(product.id)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${location}`}
      style={({ pressed }) => [
        styles.card,
        { width },
        {
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition:
                'transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease',
            },
            default: {},
          }),
        },
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={product.cover?.publicUrl}
          style={[styles.image, { backgroundColor: skeleton }]}
          contentFit="cover"
          transition={260}
          recyclingKey={String(product.id)}
          priority="low"
          cachePolicy="memory-disk"
        />
        {product.isUrgent ? (
          <View style={styles.urgent}>
            <Text style={styles.urgentText}>ACİL</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {breed ? (
          <Text style={[styles.breed, { color: textMuted }]} numberOfLines={1}>
            {breed}
          </Text>
        ) : null}
        <Text style={[styles.cardTitle, { color: text }]} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={textMuted} />
          <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
            {location}
          </Text>
          <View style={[styles.dotSep, { backgroundColor: textMuted }]} />
          <Ionicons name="eye-outline" size={13} color={textMuted} />
          <Text style={[styles.meta, { color: textMuted }]}>{views}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: text }]}>
            {formatMoney(product.price)}
          </Text>
          {product.oldPrice ? (
            <Text style={[styles.old, { color: textMuted }]}>
              {formatMoney(product.oldPrice)}
            </Text>
          ) : null}
          {product.rating > 0 ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color={textSecondary} />
              <Text style={[styles.ratingText, { color: textSecondary }]}>
                {product.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerCopy: { gap: 4, flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.45,
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
  card: { gap: 14 },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.05,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  urgent: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: URGENT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  urgentText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  body: { gap: 6, paddingHorizontal: 2 },
  breed: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    letterSpacing: -0.25,
    minHeight: 42,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: { fontSize: 12, fontWeight: '500', flexShrink: 1 },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.45,
    marginHorizontal: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  old: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  ratingText: { fontSize: 12, fontWeight: '600' },
});
