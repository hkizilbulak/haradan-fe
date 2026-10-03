import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { openVideoUrl, parseVideoUrl } from '@/utils/videoUrl';
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
  /** Video linki — varsa galerinin en sonuna video slaytı eklenir. */
  videoUrl?: string | null;
  /** Video oynatma durumu değiştiğinde üst bileşeni bilgilendirir (örn. mobilde üst barı gizlemek için). */
  onVideoPlayStateChange?: (isPlaying: boolean) => void;
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
  videoUrl,
  onVideoPlayStateChange,
}: AdvertGalleryProps) {
  const isWide = useIsWideLayout();
  const isMobile = fullBleed || !isWide;
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState<number>(() => {
    return Dimensions.get('window').width || 390;
  });
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const parsedVideo = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);
  const hasVideo = parsedVideo.isValid;
  const photosCount = items?.length || 0;
  const totalCount = photosCount + (hasVideo ? 1 : 0);
  const videoIndex = hasVideo ? photosCount : -1;
  const isCurrentSlideVideo = hasVideo && index === videoIndex;
  const shouldShowExpandButton = (showExpandButton ?? !isMobile) && !isCurrentSlideVideo;

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Slayttan ayrılınca video oynatmayı durdur
  useEffect(() => {
    if (!isCurrentSlideVideo && isVideoPlaying) {
      setIsVideoPlaying(false);
      onVideoPlayStateChange?.(false);
    }
  }, [isCurrentSlideVideo, isVideoPlaying, onVideoPlayStateChange]);

  const embedUrl = useMemo(() => {
    if (!hasVideo) return null;
    if (parsedVideo.platform === 'youtube' && parsedVideo.videoId) {
      return `https://www.youtube-nocookie.com/embed/${parsedVideo.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    }
    if (parsedVideo.platform === 'vimeo' && parsedVideo.videoId) {
      return `https://player.vimeo.com/video/${parsedVideo.videoId}?autoplay=1`;
    }
    if (parsedVideo.platform === 'dailymotion' && parsedVideo.videoId) {
      return `https://www.dailymotion.com/embed/video/${parsedVideo.videoId}?autoplay=1`;
    }
    return null;
  }, [hasVideo, parsedVideo.platform, parsedVideo.videoId]);

  const handlePlayVideo = useCallback(() => {
    if (Platform.OS === 'web' && embedUrl) {
      setIsVideoPlaying(true);
      onVideoPlayStateChange?.(true);
    } else {
      openVideoUrl(parsedVideo.url);
    }
  }, [embedUrl, parsedVideo.url, onVideoPlayStateChange]);

  const handleStopVideo = useCallback(() => {
    setIsVideoPlaying(false);
    onVideoPlayStateChange?.(false);
  }, [onVideoPlayStateChange]);

  const openLightbox = useCallback((targetIndex: number) => {
    if (targetIndex >= photosCount) return;
    setLightboxIndex(targetIndex);
    setLightboxVisible(true);
  }, [photosCount]);

  const containerWidthRef = useRef<number>(slideWidth);
  const scrollRef = useRef<ScrollView>(null);
  const userInteractingRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  const skeleton = useThemeColor('skeleton');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');
  const primary = useThemeColor('primary');

  const goToIndex = useCallback(
    (targetIndex: number, animated = true) => {
      const validIndex = Math.min(Math.max(targetIndex, 0), Math.max(0, totalCount - 1));
      setIndex(validIndex);
      const w = containerWidthRef.current || slideWidth;
      if (w > 0) {
        scrollRef.current?.scrollTo({ x: validIndex * w, animated });
      }
    },
    [totalCount, slideWidth]
  );

  const updateIndexFromOffset = useCallback(
    (offsetX: number) => {
      const w = containerWidthRef.current || slideWidth || 1;
      if (w <= 0) return;
      const next = Math.round(offsetX / w);
      const clamped = Math.min(Math.max(next, 0), Math.max(0, totalCount - 1));
      setIndex((prev) => (prev === clamped ? prev : clamped));
    },
    [totalCount, slideWidth]
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

  // Otomatik geçiş (kullanıcı manuel kaydırırken veya videodayken duraklar)
  useEffect(() => {
    if (totalCount < 2) return;
    const timer = setInterval(() => {
      if (pausedRef.current || userInteractingRef.current || isCurrentSlideVideo || isVideoPlaying) return;
      setIndex((curr) => {
        const next = (curr + 1) % totalCount;
        const w = containerWidthRef.current || slideWidth;
        if (w > 0) {
          scrollRef.current?.scrollTo({ x: next * w, animated: true });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [totalCount, slideWidth, isCurrentSlideVideo, isVideoPlaying]);

  if (totalCount === 0) return null;

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

          {/* Video Slaytı (Fotoğrafların En Sonunda) */}
          {hasVideo && (
            <View
              key="advert-gallery-video-slide"
              style={[
                styles.slide,
                { width: slideWidth, height: '100%' },
              ]}
            >
              {isVideoPlaying && embedUrl && Platform.OS === 'web' ? (
                <View style={styles.videoEmbedWrap}>
                  <iframe
                    src={embedUrl}
                    title="İlan Videosu"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                  {/* Floating Kapat & YouTube'da Aç Çubuğu */}
                  <View style={isMobile ? styles.videoEmbedHeaderMobile : styles.videoEmbedHeaderDesktop}>
                    <Pressable
                      onPress={handleStopVideo}
                      style={({ pressed }) => [
                        styles.videoEmbedClosePill,
                        pressed && { opacity: 0.8 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Videodan çık ve fotoğraflara dön"
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                      <Text style={styles.videoEmbedPillText}>Kapat</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => openVideoUrl(parsedVideo.url)}
                      style={({ pressed }) => [
                        styles.videoEmbedExternalPill,
                        pressed && { opacity: 0.8 },
                      ]}
                      accessibilityRole="link"
                      accessibilityLabel="YouTube'da Aç"
                    >
                      <Text style={styles.videoEmbedPillText}>YouTube'da Aç</Text>
                      <Ionicons name="open-outline" size={13} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePlayVideo}
                  accessibilityRole="button"
                  accessibilityLabel={`${parsedVideo.platformName} videosunu oynat`}
                  style={[
                    styles.videoSlidePressable,
                    Platform.select({
                      web: { cursor: 'pointer' as any },
                      default: {},
                    }),
                  ]}
                >
                  {/* Video Arka Plan Afişi (Cover - Siyah bar olmaksızın tam kaplar) */}
                  {parsedVideo.thumbnailUrl ? (
                    <Image
                      source={{ uri: parsedVideo.thumbnailUrl }}
                      style={styles.videoSlidePoster}
                      contentFit="cover"
                      priority="high"
                    />
                  ) : (
                    <View style={[styles.videoSlidePoster, styles.videoFallbackArea]}>
                      <Ionicons name="film-outline" size={54} color="rgba(255,255,255,0.4)" />
                    </View>
                  )}

                  {/* Sinematik Karartma Katmanı */}
                  <View style={styles.videoCinemaScrim} pointerEvents="none" />

                  {/* Üst Çubuk (Yalnızca Masaüstünde; Sağ üstte harici açma butonu) */}
                  {!isMobile && (
                    <View style={styles.videoTopHeader}>
                      <View style={{ flex: 1 }} />
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openVideoUrl(parsedVideo.url);
                        }}
                        accessibilityRole="link"
                        accessibilityLabel="Yeni sekmede izle"
                        style={({ pressed }) => [
                          styles.videoExternalPill,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text style={styles.videoExternalText}>YouTube'da Aç</Text>
                        <Ionicons name="open-outline" size={13} color="#ffffff" />
                      </Pressable>
                    </View>
                  )}

                  {/* Tam Merkez: Yalnızca Büyük Oynat Butonu */}
                  <View style={styles.videoCenterPlayArea} pointerEvents="none">
                    <View style={styles.videoPlayGlow}>
                      <View style={styles.videoPlayCircle}>
                        <Ionicons name="play" size={34} color="#ffffff" style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>

        {/* Masaüstü Sol & Sağ Navigasyon Okları */}
        {isWide && totalCount > 1 && !isVideoPlaying && (
          <>
            {index > 0 && (
              <Pressable
                onPress={() => goToIndex(index - 1, true)}
                style={[styles.navArrow, styles.navArrowLeft]}
                accessibilityRole="button"
                accessibilityLabel="Önceki"
              >
                <Ionicons name="chevron-back" size={20} color="#ffffff" />
              </Pressable>
            )}
            {index < totalCount - 1 && (
              <Pressable
                onPress={() => goToIndex(index + 1, true)}
                style={[styles.navArrow, styles.navArrowRight]}
                accessibilityRole="button"
                accessibilityLabel="Sonraki"
              >
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
              </Pressable>
            )}
          </>
        )}

        {/* Büyütme / Tam Ekran Butonu (yalnızca fotoğraflarda ve masaüstünde) */}
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
        {totalCount > 1 && !isVideoPlaying ? (
          <View style={styles.dotsOverlay} pointerEvents="none">
            <View style={styles.dotsPill}>
              {Array.from({ length: totalCount }).map((_, i) => {
                const isVideoDot = hasVideo && i === videoIndex;
                const active = i === index;
                return (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      active ? styles.dotActive : styles.dotIdle,
                      isVideoDot && (active ? styles.dotVideoActive : styles.dotVideoIdle),
                    ]}
                  />
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {/* Küçük Önizleme Fotoğrafları (Thumbnails) */}
      {showThumbs && !bleed && totalCount > 0 ? (
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

          {/* En sonda Video Küçük Resmi (Thumbnail) */}
          {hasVideo && (
            <Pressable
              key="advert-video-thumb"
              onPress={() => goToIndex(videoIndex, true)}
              style={[
                styles.thumb,
                {
                  borderColor: index === videoIndex ? '#dc2626' : border,
                  borderWidth: index === videoIndex ? 2 : 1,
                  ...Platform.select({
                    web: {
                      transition: 'border-color 180ms ease, transform 180ms ease',
                      cursor: 'pointer' as const,
                    },
                    default: {},
                  }),
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="İlan videosunu göster"
            >
              {/* Cover Görsel */}
              {parsedVideo.thumbnailUrl ? (
                <Image
                  source={{ uri: parsedVideo.thumbnailUrl }}
                  style={styles.thumbImg}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.thumbImg, styles.thumbVideoFallback]}>
                  <Ionicons name="film-outline" size={20} color="#94a3b8" />
                </View>
              )}

              {/* Karartma katmanı */}
              <View style={styles.thumbDarkScrim} pointerEvents="none" />

              {/* Video rozeti: Merkezde kırmızı play butonu */}
              <View style={styles.thumbVideoBadgeCenter} pointerEvents="none">
                <View style={styles.thumbVideoPlayCircle}>
                  <Ionicons name="play" size={13} color="#ffffff" style={{ marginLeft: 2 }} />
                </View>
              </View>

              {/* Alt Pill: VİDEO */}
              <View style={styles.thumbVideoTagPill} pointerEvents="none">
                <Text style={styles.thumbVideoTagText}>VİDEO</Text>
              </View>
            </Pressable>
          )}
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
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'background-color 150ms ease, transform 150ms ease',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
      } as any,
      default: {},
    }),
  },
  navArrowLeft: {
    left: 14,
  },
  navArrowRight: {
    right: 14,
  },
  videoSlidePressable: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSlidePoster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoCinemaScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    zIndex: 2,
  },
  videoTopHeader: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  videoBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' } as any,
      default: {},
    }),
  },
  videoBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  videoExternalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        backdropFilter: 'blur(10px)',
        transition: 'opacity 150ms ease',
      } as any,
      default: {},
    }),
  },
  videoExternalText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoCenterPlayArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 4,
  },
  videoPlayGlow: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 0 32px rgba(220, 38, 38, 0.65)',
      } as any,
      default: {},
    }),
  },
  videoPlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  videoPlayTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' } as any,
      default: {},
    }),
  },
  videoPlayTitleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  videoEmbedWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoEmbedHeaderMobile: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 25,
    pointerEvents: 'box-none',
  },
  videoEmbedHeaderDesktop: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 25,
    pointerEvents: 'box-none',
  },
  videoEmbedClosePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
      } as any,
      default: {},
    }),
  },
  videoEmbedExternalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
      } as any,
      default: {},
    }),
  },
  videoEmbedPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  videoMobileBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 4,
  },
  videoMobileBadgeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  videoFallbackArea: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  thumbDarkScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 2,
  },
  thumbVideoBadgeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  thumbVideoPlayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      } as any,
      default: {},
    }),
  },
  thumbVideoTagPill: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 3,
  },
  thumbVideoTagText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  thumbVideoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  dotVideoActive: {
    backgroundColor: '#ef4444',
    width: 22,
  },
  dotVideoIdle: {
    backgroundColor: 'rgba(239, 68, 68, 0.55)',
    width: 6,
  },
});
