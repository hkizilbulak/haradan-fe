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

  const clampPanRef = useRef<(x: number, y: number, currentZoom: number) => { x: number; y: number }>(() => ({ x: 0, y: 0 }));

  // Clamp pan movement based on current zoom and viewport so every edge/corner is reachable
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (currentZoom <= 1) return { x: 0, y: 0 };
      const maxW = winWidth - 32;
      const maxH = winHeight - 160;
      const maxPanX = Math.max(0, (maxW * currentZoom - maxW) / 2 + 80);
      const maxPanY = Math.max(0, (maxH * currentZoom - maxH) / 2 + 80);
      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, x)),
        y: Math.min(maxPanY, Math.max(-maxPanY, y)),
      };
    },
    [winWidth, winHeight]
  );
  clampPanRef.current = clampPan;

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

  // Zoom focused on a specific viewport coordinate (e.g. mouse cursor or double click)
  const zoomToPoint = useCallback(
    (clientX: number, clientY: number, targetZoom: number) => {
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +targetZoom.toFixed(2)));

      if (clampedZoom <= 1) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      // Calculate center of stage
      let centerX = winWidth / 2;
      let centerY = winHeight / 2;
      const stageEl = containerRef.current as unknown as HTMLElement | null;
      if (stageEl && typeof stageEl.getBoundingClientRect === 'function') {
        const rect = stageEl.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }

      const mouseX = clientX - centerX;
      const mouseY = clientY - centerY;

      // Keep point under cursor fixed in viewport
      const ratio = clampedZoom / currentZoom;
      const newPanX = mouseX - (mouseX - currentPan.x) * ratio;
      const newPanY = mouseY - (mouseY - currentPan.y) * ratio;

      const clamped = clampPanRef.current(newPanX, newPanY, clampedZoom);
      setZoom(clampedZoom);
      setPan(clamped);
    },
    [winWidth, winHeight]
  );

  const zoomIn = useCallback(() => {
    const currentZoom = zoomRef.current;
    const nextZoom = Math.min(MAX_ZOOM, +(currentZoom + 0.5).toFixed(1));
    if (nextZoom === currentZoom) return;
    const ratio = nextZoom / currentZoom;
    const newPan = clampPanRef.current(
      panRef.current.x * ratio,
      panRef.current.y * ratio,
      nextZoom
    );
    setZoom(nextZoom);
    setPan(newPan);
  }, []);

  const zoomOut = useCallback(() => {
    const currentZoom = zoomRef.current;
    const nextZoom = Math.max(MIN_ZOOM, +(currentZoom - 0.5).toFixed(1));
    if (nextZoom === currentZoom) return;
    if (nextZoom <= 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      const ratio = nextZoom / currentZoom;
      const newPan = clampPanRef.current(
        panRef.current.x * ratio,
        panRef.current.y * ratio,
        nextZoom
      );
      setZoom(nextZoom);
      setPan(newPan);
    }
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

  const handleDoubleTap = useCallback(
    (clientX?: number, clientY?: number) => {
      if (zoomRef.current > 1) {
        resetZoom();
      } else {
        const x = clientX ?? winWidth / 2;
        const y = clientY ?? winHeight / 2;
        zoomToPoint(x, y, DOUBLE_TAP_ZOOM);
      }
    },
    [resetZoom, zoomToPoint, winWidth, winHeight]
  );

  // Touch handler for native platforms
  const handlePress = useCallback(
    (e: any) => {
      if (Platform.OS === 'web') return;
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        const locX = e?.nativeEvent?.pageX ?? winWidth / 2;
        const locY = e?.nativeEvent?.pageY ?? winHeight / 2;
        handleDoubleTap(locX, locY);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [handleDoubleTap, winWidth, winHeight]
  );

  // Mobile Pinch & Pan Responder
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartZoomRef = useRef<number>(1);

  const getTouchesDist = (touches: any[]) => {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web' && zoomRef.current > 1,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (Platform.OS === 'web') return false;
        return (
          (zoomRef.current > 1 && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3)) ||
          gestureState.numberActiveTouches >= 2
        );
      },
      onPanResponderGrant: (e) => {
        if (Platform.OS === 'web') return;
        panStartRef.current = { ...panRef.current };
        setIsDragging(true);
        if (e.nativeEvent.touches && e.nativeEvent.touches.length >= 2) {
          pinchStartDistRef.current = getTouchesDist(e.nativeEvent.touches);
          pinchStartZoomRef.current = zoomRef.current;
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (Platform.OS === 'web') return;
        if (e.nativeEvent.touches && e.nativeEvent.touches.length >= 2) {
          const dist = getTouchesDist(e.nativeEvent.touches);
          if (dist > 0 && pinchStartDistRef.current > 0) {
            const factor = dist / pinchStartDistRef.current;
            const nextZoom = Math.min(
              MAX_ZOOM,
              Math.max(MIN_ZOOM, +(pinchStartZoomRef.current * factor).toFixed(2))
            );
            setZoom(nextZoom);
            setPan((p) => clampPanRef.current(p.x, p.y, nextZoom));
          }
        } else if (zoomRef.current > 1) {
          const targetX = panStartRef.current.x + gestureState.dx;
          const targetY = panStartRef.current.y + gestureState.dy;
          const clamped = clampPanRef.current(targetX, targetY, zoomRef.current);
          setPan(clamped);
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        pinchStartDistRef.current = 0;
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        pinchStartDistRef.current = 0;
      },
    })
  ).current;

  // Web mouse drag, wheel focal zoom, and keyboard navigation
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    // Prevent body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let isPointerDown = false;
    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;
    let hasDragged = false;
    let downTime = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      // Do not drag if clicked on top controls, nav arrows, or thumbnails
      if (target?.closest('button, [role="button"], [data-no-drag="true"]')) {
        return;
      }

      // Check if click was inside image stage
      const stageEl = containerRef.current as unknown as HTMLElement | null;
      if (stageEl && !stageEl.contains(target)) {
        return;
      }

      e.preventDefault();
      isPointerDown = true;
      hasDragged = false;
      downTime = Date.now();
      startX = e.clientX;
      startY = e.clientY;
      startPanX = panRef.current.x;
      startPanY = panRef.current.y;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!hasDragged) {
          hasDragged = true;
          setIsDragging(true);
        }
      }

      if (zoomRef.current > 1) {
        const clamped = clampPanRef.current(startPanX + dx, startPanY + dy, zoomRef.current);
        setPan(clamped);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      setIsDragging(false);

      const elapsed = Date.now() - downTime;
      // Quick click without drag -> trigger tap / double tap
      if (!hasDragged && elapsed < 350) {
        const now = Date.now();
        if (now - lastTapRef.current < 350) {
          if (zoomRef.current > 1) {
            resetZoom();
          } else {
            zoomToPoint(e.clientX, e.clientY, DOUBLE_TAP_ZOOM);
          }
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        resetZoom();
      } else if (e.key === 'ArrowLeft') {
        if (zoomRef.current > 1) {
          setPan((p) => clampPanRef.current(p.x + 60, p.y, zoomRef.current));
        } else {
          handlePrev();
        }
      } else if (e.key === 'ArrowRight') {
        if (zoomRef.current > 1) {
          setPan((p) => clampPanRef.current(p.x - 60, p.y, zoomRef.current));
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowUp') {
        if (zoomRef.current > 1) {
          setPan((p) => clampPanRef.current(p.x, p.y + 60, zoomRef.current));
        }
      } else if (e.key === 'ArrowDown') {
        if (zoomRef.current > 1) {
          setPan((p) => clampPanRef.current(p.x, p.y - 60, zoomRef.current));
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.35 : -0.35;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(zoomRef.current + delta).toFixed(2)));
      zoomToPoint(e.clientX, e.clientY, next);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [visible, onClose, handlePrev, handleNext, zoomIn, zoomOut, resetZoom, zoomToPoint]);

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
          {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        >
          <Pressable
            onPress={Platform.OS === 'web' ? undefined : handlePress}
            style={[
              styles.imageWrap,
              Platform.select({
                web: {
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  userSelect: 'none',
                  touchAction: 'none',
                } as any,
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
                ? 'Sürükleyerek inceleyin • Çift tıkla sıfırlayın • Ok tuşlarıyla kaydırın'
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
                    accessibilityRole="button"
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
        style={[
          styles.fullImg,
          Platform.select({
            web: {
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserDrag: 'none',
              userDrag: 'none',
            } as any,
            default: {},
          }),
        ]}
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
    ...Platform.select({
      web: {
        touchAction: 'none' as const,
        userSelect: 'none' as const,
      },
      default: {},
    }),
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        touchAction: 'none' as const,
        userSelect: 'none' as const,
      },
      default: {},
    }),
  },
  imgTransformContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        touchAction: 'none' as const,
        userSelect: 'none' as const,
      },
      default: {},
    }),
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
