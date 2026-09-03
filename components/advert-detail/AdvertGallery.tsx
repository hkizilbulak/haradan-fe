import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useMediaImageSource } from '@/hooks/useMediaImageSource';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { PublicMediaItem } from '@/types';

type AdvertGalleryProps = {
  items: PublicMediaItem[];
  height?: number;
  /** Kenardan kenara — mobil detay hero. */
  fullBleed?: boolean;
  /** Alt küçük görsel şeridi. */
  showThumbs?: boolean;
  /** Sahip önizlemesi — yayınlanmamış ilan görselleri için Bearer. */
  accessToken?: string | null;
};

export const AdvertGallery = memo(function AdvertGallery({
  items,
  height = 420,
  fullBleed = false,
  showThumbs = true,
  accessToken,
}: AdvertGalleryProps) {
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState<number>(() => {
    return Dimensions.get('window').width || 390;
  });
  const containerWidthRef = useRef<number>(slideWidth);
  const scrollRef = useRef<ScrollView>(null);
  const userInteractingRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  const skeleton = useThemeColor('skeleton');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');

  const goToIndex = useCallback(
    (targetIndex: number, animated = true) => {
      const validIndex = Math.min(Math.max(targetIndex, 0), items.length - 1);
      setIndex(validIndex);
      const w = containerWidthRef.current || slideWidth;
      if (w > 0) {
        scrollRef.current?.scrollTo({ x: validIndex * w, animated });
      }
    },
    [items.length, slideWidth]
  );

  const updateIndexFromOffset = useCallback(
    (offsetX: number) => {
      const w = containerWidthRef.current || slideWidth || 1;
      if (w <= 0) return;
      const next = Math.round(offsetX / w);
      const clamped = Math.min(Math.max(next, 0), items.length - 1);
      setIndex((prev) => (prev === clamped ? prev : clamped));
    },
    [items.length, slideWidth]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      userInteractingRef.current = true;
      const offsetX = e.nativeEvent.contentOffset.x;
      updateIndexFromOffset(offsetX);
    },
    [updateIndexFromOffset]
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      updateIndexFromOffset(offsetX);
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 2500);
    },
    [updateIndexFromOffset]
  );

  // Otomatik geçiş (kullanıcı manuel kaydırırken duraklar)
  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (pausedRef.current || userInteractingRef.current) return;
      setIndex((curr) => {
        const next = (curr + 1) % items.length;
        const w = containerWidthRef.current || slideWidth;
        if (w > 0) {
          scrollRef.current?.scrollTo({ x: next * w, animated: true });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length, slideWidth]);

  if (!items || items.length === 0) return null;

  const bleed = fullBleed;

  return (
    <View
      style={[styles.wrap, bleed && styles.wrapBleed]}
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
    >
      <View
        style={[
          styles.main,
          { height, backgroundColor: surface },
          bleed && styles.mainBleed,
        ]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) {
            containerWidthRef.current = w;
            setSlideWidth(w);
          }
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          onScroll={handleScroll}
          onScrollBeginDrag={() => {
            userInteractingRef.current = true;
          }}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          style={styles.scroller}
          contentContainerStyle={styles.scrollerContent}
        >
          {items.map((item, i) => (
            <View
              key={item.assetId || item.publicUrl || i}
              style={[
                styles.slide,
                { width: slideWidth, height: '100%' },
              ]}
            >
              <AuthMediaImage
                uri={item.publicUrl}
                accessToken={accessToken}
                style={[styles.mainImg, { backgroundColor: skeleton }]}
                transition={280}
                priority={i === 0 ? 'high' : 'low'}
              />
            </View>
          ))}
        </ScrollView>

        {/* Noktalar göstergesi */}
        {items.length > 1 ? (
          <View style={styles.dotsOverlay} pointerEvents="none">
            {items.map((item, i) => (
              <View
                key={item.assetId || i}
                style={[
                  styles.dot,
                  i === index ? styles.dotActive : styles.dotIdle,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* Küçük Önizleme Fotoğrafları (Thumbnails) */}
      {showThumbs && !bleed && items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {items.map((item, i) => {
            const active = i === index;
            return (
              <Pressable
                key={item.assetId || i}
                onPress={() => goToIndex(i, true)}
                style={[
                  styles.thumb,
                  {
                    borderColor: active ? header : border,
                    borderWidth: active ? 2 : 1,
                    ...Platform.select({
                      web: {
                        transition: 'border-color 180ms ease, transform 180ms ease',
                        cursor: 'pointer' as const,
                      },
                      default: {},
                    }),
                  },
                ]}
              >
                <AuthMediaImage
                  uri={item.publicUrl}
                  accessToken={accessToken}
                  style={[styles.thumbImg, { backgroundColor: skeleton }]}
                  transition={180}
                  priority="low"
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
});

function AuthMediaImage({
  uri,
  accessToken,
  style,
  transition,
  priority,
}: {
  uri: string;
  accessToken?: string | null;
  style: object;
  transition: number;
  priority: 'low' | 'high' | 'normal';
}) {
  const source = useMediaImageSource(uri, accessToken);
  return (
    <Image
      source={source}
      style={style}
      contentFit="cover"
      transition={transition}
      priority={priority}
      cachePolicy={accessToken ? 'memory' : 'memory-disk'}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  wrapBleed: { gap: 0 },
  main: {
    borderRadius: Radius.sheet,
    overflow: 'hidden',
    position: 'relative',
  },
  mainBleed: {
    borderRadius: 0,
  },
  scroller: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollerContent: {
    alignItems: 'stretch',
  },
  slide: {
    height: '100%',
    overflow: 'hidden',
  },
  mainImg: { width: '100%', height: '100%' },
  thumbs: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  dotsOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    ...Platform.select({
      web: {
        transition: 'width 220ms ease, background-color 220ms ease',
      },
      default: {},
    }),
  },
  dotActive: {
    width: 22,
    backgroundColor: '#fff',
  },
  dotIdle: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
