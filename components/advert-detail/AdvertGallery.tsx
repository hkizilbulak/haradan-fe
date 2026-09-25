import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useMediaImageSource } from '@/hooks/useMediaImageSource';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { PublicMediaItem } from '@/types';
import { ImageLightboxModal } from './ImageLightboxModal';

type AdvertGalleryProps = {
  items: PublicMediaItem[];
  height?: number;
  /** Kenardan kenara — mobil detay hero. */
  fullBleed?: boolean;
  /** Alt küçük görsel şeridi. */
  showThumbs?: boolean;
  /** Sahip önizlemesi — yayınlanmamış ilan görselleri için Bearer. */
  accessToken?: string | null;
  /** Büyütme butonunu göster/gizle (mobilde varsayılan false) */
  showExpandButton?: boolean;
};

// Web İlan Detay Galerisi kalıbı (694.6 / 440 ≈ 1.5786)
const WEB_GALLERY_ASPECT_RATIO = 694.6 / 440;

export const AdvertGallery = memo(function AdvertGallery({
  items,
  height = 420,
  fullBleed = false,
  showThumbs = true,
  accessToken,
  showExpandButton,
}: AdvertGalleryProps) {
  const isWide = useIsWideLayout();
  const isMobile = fullBleed || !isWide;
  const shouldShowExpandButton = showExpandButton ?? !isMobile;
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState<number>(() => {
    return Dimensions.get('window').width || 390;
  });
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((targetIndex: number) => {
    setLightboxIndex(targetIndex);
    setLightboxVisible(true);
  }, []);
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
  // Web ve mobilde detay galerisinin en-boy oranını (694.6 / 440 ≈ 1.5786) korur
  const effectiveHeight = slideWidth > 0
    ? Math.round(slideWidth / WEB_GALLERY_ASPECT_RATIO)
    : height;

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
          { height: effectiveHeight, backgroundColor: '#0a0d14' },
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
            <Pressable
              key={item.assetId || item.publicUrl || i}
              onPress={() => openLightbox(i)}
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafı büyüt ve incele"
              style={[
                styles.slide,
                { width: slideWidth, height: '100%' },
                Platform.select({
                  web: { cursor: 'zoom-in' as any },
                  default: {},
                }),
              ]}
            >
              {/* Buğulu Arka Plan (Beyaz zemin yerine fotoğrafın yumuşak bokeh efekti) */}
              <View style={styles.blurWrap} pointerEvents="none">
                <AuthMediaImage
                  uri={item.publicUrl}
                  accessToken={accessToken}
                  style={styles.blurBackdrop}
                  transition={280}
                  priority={i === 0 ? 'high' : 'low'}
                  contentFit="cover"
                  blurRadius={Platform.OS === 'web' ? 24 : 20}
                />
                <View style={styles.blurDim} />
              </View>

              {/* Net Ön Plan Fotoğrafı */}
              <AuthMediaImage
                uri={item.publicUrl}
                accessToken={accessToken}
                style={styles.mainImg}
                transition={280}
                priority={i === 0 ? 'high' : 'low'}
                contentFit="contain"
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Büyütme / Tam Ekran Butonu (yalnızca masaüstünde) */}
        {shouldShowExpandButton && (
          <Pressable
            onPress={() => openLightbox(index)}
            style={styles.expandBadge}
            accessibilityRole="button"
            accessibilityLabel="Büyük ekran ve yakınlaştır"
          >
            <Ionicons name="scan-outline" size={15} color="#ffffff" />
            <Text style={styles.expandText}>Büyüt</Text>
          </Pressable>
        )}

        {/* Noktalar göstergesi */}
        {items.length > 1 ? (
          <View style={styles.dotsOverlay} pointerEvents="none">
            <View style={styles.dotsPill}>
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
                {/* Buğulu Arka Plan (Ana görsel ile aynı yumuşak bokeh efekti) */}
                <View style={styles.thumbBlurWrap} pointerEvents="none">
                  <AuthMediaImage
                    uri={item.publicUrl}
                    accessToken={accessToken}
                    style={styles.thumbBlurBackdrop}
                    transition={180}
                    priority="low"
                    contentFit="cover"
                    blurRadius={Platform.OS === 'web' ? 14 : 10}
                  />
                  <View style={styles.blurDim} />
                </View>

                {/* Net Ön Plan Fotoğrafı - Ana görselle birebir aynı boşluklar ve oran */}
                <AuthMediaImage
                  uri={item.publicUrl}
                  accessToken={accessToken}
                  style={styles.thumbImg}
                  contentFit="contain"
                  transition={180}
                  priority="low"
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Tam Ekran ve Yakınlaştırma Modalı */}
      <ImageLightboxModal
        visible={lightboxVisible}
        items={items}
        initialIndex={lightboxIndex}
        accessToken={accessToken}
        onClose={() => setLightboxVisible(false)}
      />
    </View>
  );
});

function AuthMediaImage({
  uri,
  accessToken,
  style,
  transition,
  priority,
  contentFit = 'contain',
  blurRadius,
}: {
  uri: string;
  accessToken?: string | null;
  style: any;
  transition: number;
  priority: 'low' | 'high' | 'normal';
  contentFit?: 'contain' | 'cover';
  blurRadius?: number;
}) {
  const source = useMediaImageSource(uri, accessToken);
  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      transition={transition}
      priority={priority}
      cachePolicy={accessToken ? 'memory' : 'memory-disk'}
      blurRadius={blurRadius}
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
    backgroundColor: '#0a0d14',
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
    backgroundColor: '#0a0d14',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  blurWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurBackdrop: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.2 }],
    opacity: 0.88,
    ...(Platform.OS === 'web'
      ? ({
        filter: 'blur(30px)',
        WebkitFilter: 'blur(30px)',
      } as any)
      : {}),
  },
  blurDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  mainImg: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  thumbs: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  thumb: {
    width: 90,
    height: 57,
    aspectRatio: WEB_GALLERY_ASPECT_RATIO,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0a0d14',
    position: 'relative',
  },
  thumbBlurWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  thumbBlurBackdrop: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.25 }],
    opacity: 0.88,
    ...(Platform.OS === 'web'
      ? ({
        filter: 'blur(16px)',
        WebkitFilter: 'blur(16px)',
      } as any)
      : {}),
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  dotsOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 5,
  },
  dotsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
  expandBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
        transition: 'background-color 150ms ease, transform 150ms ease',
      },
      default: {},
    }),
  },
  expandText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
