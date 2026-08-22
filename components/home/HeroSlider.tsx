import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ActiveBannerItem } from '@/types';

const AUTO_PLAY_MS = 4500;

type HeroSliderProps = {
  slides: ActiveBannerItem[];
  onSlidePress?: (slide: ActiveBannerItem) => void;
  /** Desktop'ta sidebar yanında daha yüksek */
  height?: number;
  /** Mobil tam genişlik — köşe yuvarlaklığı yalnızca alt */
  fullBleed?: boolean;
};

/**
 * Cartzilla hero — kampanya slaytı; at görselleri cover ile dolu alan.
 */
export const HeroSlider = memo(function HeroSlider({
  slides,
  onSlidePress,
  height = 320,
  fullBleed = false,
}: HeroSliderProps) {
  const width = useLayoutWidth();
  const isWide = width >= 900;
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const containerWidthRef = useRef(width);

  const primary = useThemeColor('primary');
  const hero = useThemeColor('hero');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');

  const sorted = useMemo(
    () => slides.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [slides]
  );

  const [slideWidth, setSlideWidth] = useState(width - Spacing.md * 2);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (sorted.length < 2) return undefined;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % sorted.length;
      scrollRef.current?.scrollTo({ x: next * containerWidthRef.current, animated: true });
      setIndex(next);
    }, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [sorted.length]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = containerWidthRef.current || 1;
      const next = Math.round(e.nativeEvent.contentOffset.x / w);
      setIndex(Math.min(Math.max(next, 0), sorted.length - 1));
    },
    [sorted.length]
  );

  if (sorted.length === 0) return null;

  return (
    <View
      style={[
        styles.wrap,
        fullBleed && styles.wrapBleed,
        { height },
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        containerWidthRef.current = w;
        setSlideWidth(w);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Kampanya slaytı"
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.scroller}
        decelerationRate="fast"
      >
        {sorted.map((item, i) => (
          <Pressable
            key={item.id}
            onPress={() => onSlidePress?.(item)}
            accessibilityRole="button"
            accessibilityLabel={item.altText ?? item.title ?? 'Kampanya'}
            style={[
              styles.slide,
              {
                width: slideWidth,
                backgroundColor: hero,
                flexDirection: isWide ? 'row' : 'column',
              },
            ]}
          >
            <View style={[styles.copy, !isWide && styles.copyMobile]}>
              <Text style={[styles.eyebrow, { color: textSecondary }]} numberOfLines={1}>
                {item.altText ?? 'Haradan'}
              </Text>
              <Text style={[styles.title, { color: text }, !isWide && styles.titleMobile]} numberOfLines={3}>
                {item.title ?? 'İlanları keşfet'}
              </Text>
              <View style={[styles.cta, { backgroundColor: primary }]}>
                <Text style={styles.ctaText}>İlanları gör</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>

            <View style={[styles.media, !isWide && styles.mediaMobile]}>
              <Image
                source={item.imageUrl}
                style={[styles.image, { backgroundColor: 'transparent' }]}
                contentFit="cover"
                transition={320}
                priority={i === 0 ? 'high' : 'low'}
                cachePolicy="memory-disk"
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <HeroProgress index={index} total={sorted.length} />
    </View>
  );
});

function HeroProgress({ index, total }: { index: number; total: number }) {
  const widthAnim = useRef(new Animated.Value(((index + 1) / Math.max(total, 1)) * 100)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: ((index + 1) / Math.max(total, 1)) * 100,
      duration: 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [index, total, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressTrack} accessible={false}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  wrapBleed: {
    borderRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scroller: {
    flex: 1,
  },
  slide: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.md,
    zIndex: 2,
  },
  copyMobile: {
    paddingRight: 0,
    alignItems: 'flex-start',
    width: '100%',
  },
  eyebrow: {
    ...Typography.small,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.7,
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    minHeight: 40,
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  media: {
    flex: 1.1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  mediaMobile: {
    width: '100%',
    height: 160,
    marginTop: Spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  progressTrack: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.md,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(29,33,41,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(29,33,41,0.35)',
    borderRadius: 2,
  },
});
