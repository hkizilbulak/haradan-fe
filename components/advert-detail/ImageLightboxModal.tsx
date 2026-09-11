import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMediaImageSource } from '@/hooks/useMediaImageSource';
import type { PublicMediaItem } from '@/types';

type ImageLightboxModalProps = {
  visible: boolean;
  items: PublicMediaItem[];
  initialIndex?: number;
  accessToken?: string | null;
  onClose: () => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;

export const ImageLightboxModal = memo(function ImageLightboxModal({
  visible,
  items,
  initialIndex = 0,
  accessToken,
  onClose,
}: ImageLightboxModalProps) {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<View>(null);

  // Sync initial index whenever modal opens
  useEffect(() => {
    if (visible) {
      setIndex(Math.min(Math.max(initialIndex, 0), Math.max(0, items.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [visible, initialIndex, items.length]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, +(prev + 0.5).toFixed(1));
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, +(prev - 0.5).toFixed(1));
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setIndex((curr) => (curr - 1 + items.length) % items.length);
    resetZoom();
  }, [items.length, resetZoom]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setIndex((curr) => (curr + 1) % items.length);
    resetZoom();
  }, [items.length, resetZoom]);

  const handleDoubleTap = useCallback(() => {
    if (zoomRef.current > 1) {
      resetZoom();
    } else {
      setZoom(DOUBLE_TAP_ZOOM);
      setPan({ x: 0, y: 0 });
    }
  }, [resetZoom]);

  // Touch / Click handler to detect double tap
  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [handleDoubleTap]);

  // Clamp pan movement based on current zoom and viewport
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (currentZoom <= 1) return { x: 0, y: 0 };
      const maxPanX = (winWidth * (currentZoom - 1)) / 2;
      const maxPanY = (winHeight * (currentZoom - 1)) / 2;
      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, x)),
        y: Math.min(maxPanY, Math.max(-maxPanY, y)),
      };
    },
    [winWidth, winHeight]
  );

  // React Native PanResponder for mobile & touch dragging when zoomed
  const panStartRef = useRef({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => zoomRef.current > 1,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return zoomRef.current > 1 && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3);
      },
      onPanResponderGrant: () => {
        panStartRef.current = { ...panRef.current };
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (zoomRef.current <= 1) return;
        const targetX = panStartRef.current.x + gestureState.dx;
        const targetY = panStartRef.current.y + gestureState.dy;
        const clamped = clampPan(targetX, targetY, zoomRef.current);
        setPan(clamped);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  // Web mouse wheel zoom & keyboard listeners
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    // Prevent body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        resetZoom();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY < 0 ? 0.35 : -0.35;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prev + delta).toFixed(2)));
        if (next === MIN_ZOOM) {
          setPan({ x: 0, y: 0 });
        } else {
          setPan((p) => clampPan(p.x, p.y, next));
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [visible, onClose, handlePrev, handleNext, zoomIn, zoomOut, resetZoom, clampPan]);

  if (!visible || !items || items.length === 0) return null;

  const currentItem = items[index] ?? items[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          {/* Sol: İlan Fotoğraf Sayacı */}
          <View style={styles.counterPill}>
            <Ionicons name="images-outline" size={14} color="#ffffff" />
            <Text style={styles.counterText}>
              {index + 1} / {items.length}
            </Text>
          </View>

          {/* Sağ: Zoom Butonları ve Kapat Butonu */}
          <View style={styles.actionsRow}>
            {/* Zoom Out */}
            <Pressable
              onPress={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              style={[styles.iconBtn, zoom <= MIN_ZOOM && styles.iconBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Uzaklaştır"
            >
              <Ionicons name="remove" size={18} color={zoom <= MIN_ZOOM ? '#666' : '#fff'} />
            </Pressable>

            {/* Zoom Level Indicator / Reset Button */}
            <Pressable
              onPress={resetZoom}
              style={[styles.zoomIndicator, zoom > 1 && styles.zoomIndicatorActive]}
              accessibilityRole="button"
              accessibilityLabel="Yakınlaştırmayı sıfırla"
            >
              <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
              {zoom > 1 ? (
                <Ionicons name="refresh" size={12} color="#38bdf8" style={{ marginLeft: 3 }} />
              ) : null}
            </Pressable>

            {/* Zoom In */}
            <Pressable
              onPress={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              style={[styles.iconBtn, zoom >= MAX_ZOOM && styles.iconBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Yakınlaştır"
            >
              <Ionicons name="add" size={18} color={zoom >= MAX_ZOOM ? '#666' : '#fff'} />
            </Pressable>

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              style={[styles.iconBtn, styles.closeBtn]}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Center Main Stage */}
        <View
          ref={containerRef}
          style={styles.stage}
          {...panResponder.panHandlers}
        >
          <Pressable
            onPress={handlePress}
            style={[
              styles.imageWrap,
              Platform.select({
                web: {
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  userSelect: 'none' as const,
                },
                default: {},
              }),
            ]}
          >
            <LightboxImage
              uri={currentItem.publicUrl}
              accessToken={accessToken}
              zoom={zoom}
              pan={pan}
              winWidth={winWidth}
              winHeight={winHeight}
            />
          </Pressable>

          {/* Sol Ok (Önceki Görsel) */}
          {items.length > 1 ? (
            <Pressable
              onPress={handlePrev}
              style={[styles.navBtn, styles.navBtnLeft]}
              accessibilityRole="button"
              accessibilityLabel="Önceki fotoğraf"
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
          ) : null}

          {/* Sağ Ok (Sonraki Görsel) */}
          {items.length > 1 ? (
            <Pressable
              onPress={handleNext}
              style={[styles.navBtn, styles.navBtnRight]}
              accessibilityRole="button"
              accessibilityLabel="Sonraki fotoğraf"
            >
              <Ionicons name="chevron-forward" size={26} color="#fff" />
            </Pressable>
          ) : null}

          {/* Alt İpucu Metni */}
          <View style={styles.hintBar} pointerEvents="none">
            <Text style={styles.hintText}>
              {zoom > 1
                ? 'Sürükleyerek inceleyin • Çift tıkla sıfırlayın'
                : 'Fotoğrafa çift tıklayarak veya tekerlekle yakınlaştırabilirsiniz'}
            </Text>
          </View>
        </View>

        {/* Bottom Thumbnail Filmstrip */}
        {items.length > 1 ? (
          <View style={styles.thumbsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsList}
            >
              {items.map((item, i) => {
                const active = i === index;
                return (
                  <Pressable
                    key={item.assetId || item.publicUrl || i}
                    onPress={() => {
                      setIndex(i);
                      resetZoom();
                    }}
                    style={[
                      styles.thumbItem,
                      active && styles.thumbItemActive,
                      Platform.select({
                        web: { cursor: 'pointer' as const },
                        default: {},
                      }),
                    ]}
                  >
                    <LightboxThumb
                      uri={item.publicUrl}
                      accessToken={accessToken}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
});

function LightboxImage({
  uri,
  accessToken,
  zoom,
  pan,
  winWidth,
  winHeight,
}: {
  uri: string;
  accessToken?: string | null;
  zoom: number;
  pan: { x: number; y: number };
  winWidth: number;
  winHeight: number;
}) {
  const source = useMediaImageSource(uri, accessToken);
  // Max width & height leave room for header & thumbnails
  const maxW = winWidth - 32;
  const maxH = winHeight - 160;

  return (
    <View
      style={[
        styles.imgTransformContainer,
        {
          width: maxW,
          height: maxH,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: zoom },
          ],
        },
      ]}
    >
      <Image
        source={source}
        style={styles.fullImg}
        contentFit="contain"
        transition={200}
        priority="high"
        cachePolicy={accessToken ? 'memory' : 'memory-disk'}
      />
    </View>
  );
}

function LightboxThumb({
  uri,
  accessToken,
}: {
  uri: string;
  accessToken?: string | null;
}) {
  const source = useMediaImageSource(uri, accessToken);
  return (
    <Image
      source={source}
      style={styles.thumbImg}
      contentFit="cover"
      transition={150}
      priority="low"
      cachePolicy={accessToken ? 'memory' : 'memory-disk'}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.96)',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      },
      default: {},
    }),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    paddingBottom: 12,
    zIndex: 20,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  counterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
        transition: 'background-color 150ms ease, transform 150ms ease',
      },
      default: {},
    }),
  },
  iconBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    backgroundColor: 'rgba(225, 29, 72, 0.85)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    marginLeft: 6,
  },
  zoomIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
      },
      default: {},
    }),
  },
  zoomIndicatorActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgTransformContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
        transition: 'transform 180ms ease, background-color 180ms ease',
      },
      default: {},
    }),
  },
  navBtnLeft: {
    left: 20,
  },
  navBtnRight: {
    right: 20,
  },
  hintBar: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
  },
  thumbsContainer: {
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },
  thumbsList: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbItem: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.65,
    ...Platform.select({
      web: {
        transition: 'opacity 150ms ease, border-color 150ms ease, transform 150ms ease',
      },
      default: {},
    }),
  },
  thumbItemActive: {
    borderColor: '#38bdf8',
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
});
