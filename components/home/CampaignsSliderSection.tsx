import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
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
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ActiveBannerItem } from '@/types';

type CampaignsSliderSectionProps = {
  banners: ActiveBannerItem[];
  onBannerPress?: (banner: ActiveBannerItem) => void;
};

const AUTO_PLAY_MS = 5000;

export const CampaignsSliderSection = memo(function CampaignsSliderSection({
  banners,
  onBannerPress,
}: CampaignsSliderSectionProps) {
  const primary = useThemeColor('primary');
  const width = useLayoutWidth();
  const isWide = width >= 860;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const sortedBanners = React.useMemo(() => {
    if (!banners || banners.length === 0) return [];
    return banners.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }, [banners]);

  useEffect(() => {
    if (sortedBanners.length < 2 || containerWidth <= 0) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % sortedBanners.length;
        scrollRef.current?.scrollTo({ x: next * containerWidth, animated: true });
        return next;
      });
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [sortedBanners.length, containerWidth]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerWidth <= 0) return;
      const next = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
      setIndex(Math.min(Math.max(next, 0), sortedBanners.length - 1));
    },
    [containerWidth, sortedBanners.length]
  );

  const goToSlide = (nextIndex: number) => {
    if (containerWidth <= 0) return;
    const idx = Math.min(Math.max(nextIndex, 0), sortedBanners.length - 1);
    setIndex(idx);
    scrollRef.current?.scrollTo({ x: idx * containerWidth, animated: true });
  };

  if (sortedBanners.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Kampanyalar</Text>
        
        {sortedBanners.length > 1 ? (
          <View style={styles.navControls}>
            <Pressable
              onPress={() => goToSlide(index - 1)}
              disabled={index === 0}
              accessibilityRole="button"
              accessibilityLabel="Önceki kampanya"
              style={({ pressed }) => [
                styles.navBtn,
                index === 0 && styles.navBtnDisabled,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="chevron-back" size={16} color="#ffffff" />
            </Pressable>
            
            <Pressable
              onPress={() => goToSlide(index + 1)}
              disabled={index === sortedBanners.length - 1}
              accessibilityRole="button"
              accessibilityLabel="Sonraki kampanya"
              style={({ pressed }) => [
                styles.navBtn,
                index === sortedBanners.length - 1 && styles.navBtnDisabled,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View
        style={[styles.sliderCard, { height: isWide ? 260 : 200 }]}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          decelerationRate="fast"
          style={StyleSheet.absoluteFillObject}
        >
          {sortedBanners.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onBannerPress?.(item)}
              accessibilityRole="button"
              accessibilityLabel={item.title ?? 'Kampanya'}
              style={[styles.slide, { width: containerWidth }]}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.slideOverlay} />

              <View style={styles.slideContent}>
                {item.altText ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.altText}</Text>
                  </View>
                ) : null}

                {item.title ? (
                  <Text style={[styles.slideTitle, !isWide && styles.slideTitleMobile]} numberOfLines={2}>
                    {item.title}
                  </Text>
                ) : null}

                <View style={[styles.detailCta, { backgroundColor: primary }]}>
                  <Text style={styles.detailCtaText}>Kampanya Detayı</Text>
                  <Ionicons name="arrow-forward" size={12} color="#ffffff" />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {sortedBanners.length > 1 ? (
          <View style={styles.dotsWrap}>
            {sortedBanners.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => goToSlide(i)}
                style={[
                  styles.dot,
                  i === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#0f172a',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  sliderCard: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
      default: {},
    }),
  },
  slide: {
    height: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  slideContent: {
    zIndex: 2,
    maxWidth: 580,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slideTitleMobile: {
    fontSize: 18,
    lineHeight: 24,
  },
  detailCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  detailCtaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#ffffff',
  },
});
