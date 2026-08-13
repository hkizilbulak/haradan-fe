import React, { memo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { BrandItem } from '@/types';

type BrandStripProps = {
  brands: BrandItem[];
  onAllPress?: () => void;
  onBrandPress?: (id: string) => void;
};

const ITEM_W_DESKTOP = 140;
const ITEM_W_MOBILE = 108;
const GAP_DESKTOP = 36;
const GAP_MOBILE = 20;

/** Çerçevesiz marka logo slider. */
export const BrandStrip = memo(function BrandStrip({ brands, onBrandPress }: BrandStripProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const header = useThemeColor('header');

  const itemW = isWide ? ITEM_W_DESKTOP : ITEM_W_MOBILE;
  const gap = isWide ? GAP_DESKTOP : GAP_MOBILE;
  const step = itemW + gap;

  const scrollBy = (dir: 1 | -1) => {
    const max = Math.max(0, brands.length * step - step * 3);
    const next = Math.min(max, Math.max(0, offset.current + dir * step * 2));
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  if (brands.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.railWrap}>
        {isWide ? (
          <Pressable
            onPress={() => scrollBy(-1)}
            accessibilityRole="button"
            accessibilityLabel="Önceki markalar"
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: header, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={16} color="#fff" />
          </Pressable>
        ) : null}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.list, { gap }]}
          decelerationRate="fast"
          snapToInterval={step}
          snapToAlignment="start"
          onScroll={(e) => {
            offset.current = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
        >
          {brands.map((b) => (
            <BrandLogo
              key={b.id}
              brand={b}
              width={itemW}
              onPress={onBrandPress}
            />
          ))}
        </ScrollView>

        {isWide ? (
          <Pressable
            onPress={() => scrollBy(1)}
            accessibilityRole="button"
            accessibilityLabel="Sonraki markalar"
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

function BrandLogo({
  brand,
  width,
  onPress,
}: {
  brand: BrandItem;
  width: number;
  onPress?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => onPress?.(brand.id)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={brand.name}
      style={({ pressed }) => [
        styles.item,
        {
          width,
          opacity: pressed ? 0.7 : hovered ? 1 : 0.42,
          transform: [{ scale: hovered ? 1.03 : 1 }],
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition: 'opacity 220ms ease, transform 220ms ease',
            },
            default: {},
          }),
        },
      ]}
    >
      <Image
        source={brand.logoUrl}
        style={[
          styles.logo,
          Platform.select({
            web: {
              filter: hovered ? 'grayscale(0)' : 'grayscale(1)',
            } as object,
            default: {},
          }),
        ]}
        contentFit="contain"
        transition={200}
        priority="low"
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing['2xl'],
    paddingVertical: Spacing.md,
  },
  railWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  list: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: 40,
  },
});
