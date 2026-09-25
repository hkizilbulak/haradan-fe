import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { toast } from '@/components/ui';

export type AspectRatioOption = 'FREE' | 'WEB';

interface ImageCropperModalProps {
  visible: boolean;
  imageUri: string;
  originalUri?: string;
  fileName?: string;
  onClose: () => void;
  onSave: (croppedUri: string, croppedFile?: File) => void;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Web İlan Detay Galerisi ölçüsü (694.6 / 440 ≈ 1.5786)
const WEB_GALLERY_ASPECT_RATIO = 694.6 / 440;

const PRESETS: { key: AspectRatioOption; label: string; ratio: number | null; icon?: string }[] = [
  { key: 'FREE', label: 'Tüm Fotoğraf (Serbest)', ratio: null },
  { key: 'WEB', label: 'İlan Kalıbı', ratio: WEB_GALLERY_ASPECT_RATIO },
];

export function ImageCropperModal({
  visible,
  imageUri,
  originalUri,
  fileName = 'cropped_image.jpg',
  onClose,
  onSave,
}: ImageCropperModalProps) {
  const [activeSourceUri, setActiveSourceUri] = useState<string>(imageUri);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('FREE');
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [safeUri, setSafeUri] = useState<string>(imageUri);
  const createdBlobUrlRef = useRef<string | null>(null);

  const containerRef = useRef<View>(null);
  const dragInfoRef = useRef<{
    mode: 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; startBox: CropBox } | null>(null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxDisplayWidth = Math.min(windowWidth - 48, 560);
  const maxDisplayHeight = Math.min(windowHeight * 0.55, 420);

  // Synchronize activeSourceUri when imageUri or visible changes
  useEffect(() => {
    setActiveSourceUri(imageUri);
  }, [visible, imageUri]);

  // Clean up created blob URL on unmount
  useEffect(() => {
    return () => {
      if (createdBlobUrlRef.current) {
        URL.revokeObjectURL(createdBlobUrlRef.current);
        createdBlobUrlRef.current = null;
      }
    };
  }, []);

  // Load natural dimensions and resolve safe blob when image changes or modal opens
  useEffect(() => {
    if (!visible || !activeSourceUri) {
      setNaturalSize(null);
      setLoading(true);
      setRotation(0);
      setAspectRatio('FREE');
      setSafeUri('');
      return;
    }

    setLoading(true);
    setRotation(0);
    setAspectRatio('FREE');

    let isCancelled = false;

    const cleanupPreviousBlob = () => {
      if (createdBlobUrlRef.current) {
        URL.revokeObjectURL(createdBlobUrlRef.current);
        createdBlobUrlRef.current = null;
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const loadWebImage = async () => {
        let activeUrl = activeSourceUri;

        // Remote URL ise tarayıcı HTTP önbellek ve CORS sorununu önlemek için blob olarak getir
        if (activeSourceUri.startsWith('http://') || activeSourceUri.startsWith('https://')) {
          try {
            const cacheBuster = (activeSourceUri.includes('?') ? '&' : '?') + '_cb=' + Date.now();
            const res = await fetch(activeSourceUri + cacheBuster, { mode: 'cors' });
            if (res.ok) {
              const blob = await res.blob();
              if (isCancelled) return;
              cleanupPreviousBlob();
              const blobUrl = URL.createObjectURL(blob);
              createdBlobUrlRef.current = blobUrl;
              activeUrl = blobUrl;
            }
          } catch (e) {
            console.warn('Direct blob fetch failed, falling back to original url:', e);
          }
        }

        if (isCancelled) return;
        setSafeUri(activeUrl);

        const img = new window.Image();
        if (activeUrl.startsWith('http://') || activeUrl.startsWith('https://')) {
          img.crossOrigin = 'anonymous';
        }

        img.onload = () => {
          if (isCancelled) return;
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          setLoading(false);
        };

        img.onerror = () => {
          if (isCancelled) return;
          const fallback = new window.Image();
          fallback.onload = () => {
            if (isCancelled) return;
            setNaturalSize({ width: fallback.naturalWidth, height: fallback.naturalHeight });
            setLoading(false);
          };
          fallback.onerror = () => {
            if (isCancelled) return;
            setLoading(false);
          };
          fallback.src = activeSourceUri;
        };

        img.src = activeUrl;
      };

      void loadWebImage();
    } else {
      setSafeUri(activeSourceUri);
      setNaturalSize({ width: 1200, height: 900 });
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [visible, activeSourceUri]);

  const initCropBox = useCallback((dispW: number, dispH: number, preset: AspectRatioOption) => {
    const targetPreset = PRESETS.find((p) => p.key === preset);
    const ratio = targetPreset?.ratio;

    if (!ratio) {
      // Free preset: encompasses 100% of the entire photo
      setCropBox({
        x: 0,
        y: 0,
        width: dispW,
        height: dispH,
      });
      return;
    }

    let bw = dispW;
    let bh = bw / ratio;

    if (bh > dispH) {
      bh = dispH;
      bw = bh * ratio;
    }

    bw = Math.round(bw);
    bh = Math.round(bh);
    const bx = Math.round((dispW - bw) / 2);
    const by = Math.round((dispH - bh) / 2);

    setCropBox({
      x: Math.max(0, bx),
      y: Math.max(0, by),
      width: Math.min(bw, dispW),
      height: Math.min(bh, dispH),
    });
  }, []);

  // Compute displayed image box dimensions based on rotation and container limits
  useEffect(() => {
    if (!naturalSize) return;

    const isFlipped = rotation === 90 || rotation === 270;
    const currentW = isFlipped ? naturalSize.height : naturalSize.width;
    const currentH = isFlipped ? naturalSize.width : naturalSize.height;

    // Scale image up or down to comfortably fit the cropper bounds without being restricted to <= 1
    const scale = Math.min(maxDisplayWidth / currentW, maxDisplayHeight / currentH);
    const dispW = Math.max(Math.round(currentW * scale), 200);
    const dispH = Math.max(Math.round(currentH * scale), 150);

    setDisplaySize({ width: dispW, height: dispH });

    // Initialize or adapt crop box to current aspect ratio
    initCropBox(dispW, dispH, aspectRatio);
  }, [naturalSize, rotation, maxDisplayWidth, maxDisplayHeight, initCropBox, aspectRatio]);

  const handleSelectPreset = (preset: AspectRatioOption) => {
    setAspectRatio(preset);
    if (displaySize.width > 0 && displaySize.height > 0) {
      initCropBox(displaySize.width, displaySize.height, preset);
    }
  };

  // Drag handling on Web with Pointer Capture & Touch support
  const startDrag = (
    mode: 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r',
    clientX: number,
    clientY: number,
    event?: any
  ) => {
    try {
      if (event?.target?.setPointerCapture && event?.pointerId !== undefined) {
        event.target.setPointerCapture(event.pointerId);
      }
    } catch {}
    dragInfoRef.current = {
      mode,
      startX: clientX,
      startY: clientY,
      startBox: { ...cropBox },
    };
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onPointerDownGlobal = (e: PointerEvent) => {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // When 2 fingers touch, switch to pinch-to-resize
      if (activePointersRef.current.size === 2) {
        const pts = Array.from(activePointersRef.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartRef.current = { dist, startBox: { ...cropBox } };
        dragInfoRef.current = null; // Pinch supersedes single-touch drag
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Handle 2-finger pinch resize on mobile
      if (pinchStartRef.current && activePointersRef.current.size >= 2) {
        e.preventDefault();
        const pts = Array.from(activePointersRef.current.values());
        const newDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchStartRef.current.dist > 10) {
          const scale = newDist / pinchStartRef.current.dist;
          const { startBox } = pinchStartRef.current;
          const dispW = displaySize.width;
          const dispH = displaySize.height;
          const activePreset = PRESETS.find((p) => p.key === aspectRatio);
          const ratio = activePreset?.ratio;

          const centerX = startBox.x + startBox.width / 2;
          const centerY = startBox.y + startBox.height / 2;

          let newW = Math.round(startBox.width * scale);
          let newH = ratio ? Math.round(newW / ratio) : Math.round(startBox.height * scale);

          const minSize = 40;
          if (newW < minSize) {
            newW = minSize;
            if (ratio) newH = Math.round(newW / ratio);
          }
          if (newH < minSize) {
            newH = minSize;
            if (ratio) newW = Math.round(newH * ratio);
          }

          if (newW > dispW) {
            newW = dispW;
            if (ratio) newH = Math.round(newW / ratio);
          }
          if (newH > dispH) {
            newH = dispH;
            if (ratio) newW = Math.round(newH * ratio);
          }

          let newX = Math.round(centerX - newW / 2);
          let newY = Math.round(centerY - newH / 2);

          newX = Math.max(0, Math.min(dispW - newW, newX));
          newY = Math.max(0, Math.min(dispH - newH, newY));

          setCropBox({
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          });
        }
        return;
      }

      const info = dragInfoRef.current;
      if (!info) return;

      e.preventDefault();
      const dx = e.clientX - info.startX;
      const dy = e.clientY - info.startY;
      const { startBox, mode } = info;
      const dispW = displaySize.width;
      const dispH = displaySize.height;
      const activePreset = PRESETS.find((p) => p.key === aspectRatio);
      const ratio = activePreset?.ratio;

      const minSize = 40;

      if (mode === 'move') {
        const nextX = Math.max(0, Math.min(dispW - startBox.width, startBox.x + dx));
        const nextY = Math.max(0, Math.min(dispH - startBox.height, startBox.y + dy));
        setCropBox((prev) => ({ ...prev, x: nextX, y: nextY }));
      } else if (mode === 'r') {
        let newW = Math.max(minSize, Math.min(dispW - startBox.x, startBox.width + dx));
        let newH = startBox.height;
        if (ratio) {
          newH = Math.round(newW / ratio);
          if (startBox.y + newH > dispH) {
            newH = dispH - startBox.y;
            newW = Math.round(newH * ratio);
          }
        }
        setCropBox((prev) => ({
          ...prev,
          width: Math.round(newW),
          height: Math.round(newH),
        }));
      } else if (mode === 'b') {
        let newH = Math.max(minSize, Math.min(dispH - startBox.y, startBox.height + dy));
        let newW = startBox.width;
        if (ratio) {
          newW = Math.round(newH * ratio);
          if (startBox.x + newW > dispW) {
            newW = dispW - startBox.x;
            newH = Math.round(newW / ratio);
          }
        }
        setCropBox((prev) => ({
          ...prev,
          width: Math.round(newW),
          height: Math.round(newH),
        }));
      } else if (mode === 't') {
        let newH = Math.max(minSize, startBox.height - dy);
        let newY = startBox.y + (startBox.height - newH);
        if (newY < 0) {
          newH += newY;
          newY = 0;
        }
        let newW = startBox.width;
        let newX = startBox.x;
        if (ratio) {
          newW = Math.round(newH * ratio);
          if (startBox.x + newW > dispW) {
            newW = dispW - startBox.x;
            newH = Math.round(newW / ratio);
            newY = startBox.y + (startBox.height - newH);
          }
        }
        setCropBox((prev) => ({
          ...prev,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        }));
      } else if (mode === 'l') {
        let newW = Math.max(minSize, startBox.width - dx);
        let newX = startBox.x + (startBox.width - newW);
        if (newX < 0) {
          newW += newX;
          newX = 0;
        }
        let newH = startBox.height;
        let newY = startBox.y;
        if (ratio) {
          newH = Math.round(newW / ratio);
          if (startBox.y + newH > dispH) {
            newH = dispH - startBox.y;
            newW = Math.round(newH * ratio);
            newX = startBox.x + (startBox.width - newW);
          }
        }
        setCropBox((prev) => ({
          ...prev,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        }));
      } else if (mode === 'br') {
        const delta = ratio ? (Math.abs(dx) > Math.abs(dy * ratio) ? dx : dy * ratio) : 0;
        let newW = ratio ? Math.max(minSize, startBox.width + delta) : Math.max(minSize, Math.min(dispW - startBox.x, startBox.width + dx));
        let newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, Math.min(dispH - startBox.y, startBox.height + dy));

        if (startBox.x + newW > dispW) {
          newW = dispW - startBox.x;
          if (ratio) newH = Math.round(newW / ratio);
        }
        if (startBox.y + newH > dispH) {
          newH = dispH - startBox.y;
          if (ratio) newW = Math.round(newH * ratio);
        }

        setCropBox((prev) => ({
          ...prev,
          width: Math.round(newW),
          height: Math.round(newH),
        }));
      } else if (mode === 'tl') {
        const delta = ratio ? (Math.abs(dx) > Math.abs(dy * ratio) ? -dx : -dy * ratio) : 0;
        let newW = ratio ? Math.max(minSize, startBox.width + delta) : Math.max(minSize, startBox.width - dx);
        let newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, startBox.height - dy);

        let newX = startBox.x + (startBox.width - newW);
        let newY = startBox.y + (startBox.height - newH);

        if (newX < 0) {
          newW += newX;
          newX = 0;
          if (ratio) newH = Math.round(newW / ratio);
        }
        if (newY < 0) {
          newH += newY;
          newY = 0;
          if (ratio) {
            newW = Math.round(newH * ratio);
            newX = startBox.x + (startBox.width - newW);
          }
        }

        setCropBox({
          x: Math.round(Math.max(0, newX)),
          y: Math.round(Math.max(0, newY)),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (mode === 'tr') {
        const delta = ratio ? (Math.abs(dx) > Math.abs(dy * ratio) ? dx : -dy * ratio) : 0;
        let newW = ratio ? Math.max(minSize, startBox.width + delta) : Math.max(minSize, Math.min(dispW - startBox.x, startBox.width + dx));
        let newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, startBox.height - dy);
        let newY = startBox.y + (startBox.height - newH);

        if (startBox.x + newW > dispW) {
          newW = dispW - startBox.x;
          if (ratio) newH = Math.round(newW / ratio);
        }
        if (newY < 0) {
          newH += newY;
          newY = 0;
          if (ratio) newW = Math.round(newH * ratio);
        }

        setCropBox((prev) => ({
          ...prev,
          y: Math.round(Math.max(0, newY)),
          width: Math.round(newW),
          height: Math.round(newH),
        }));
      } else if (mode === 'bl') {
        const delta = ratio ? (Math.abs(dx) > Math.abs(dy * ratio) ? -dx : dy * ratio) : 0;
        let newW = ratio ? Math.max(minSize, startBox.width + delta) : Math.max(minSize, startBox.width - dx);
        let newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, Math.min(dispH - startBox.y, startBox.height + dy));
        let newX = startBox.x + (startBox.width - newW);

        if (newX < 0) {
          newW += newX;
          newX = 0;
          if (ratio) newH = Math.round(newW / ratio);
        }
        if (ratio && startBox.y + newH > dispH) {
          newH = dispH - startBox.y;
          newW = Math.round(newH * ratio);
          newX = startBox.x + (startBox.width - newW);
        }

        setCropBox({
          x: Math.round(Math.max(0, newX)),
          y: Math.round(startBox.y),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        pinchStartRef.current = null;
      }
      if (e && (e.target as HTMLElement)?.hasPointerCapture?.(e.pointerId)) {
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }
      if (activePointersRef.current.size === 0) {
        dragInfoRef.current = null;
      }
    };

    window.addEventListener('pointerdown', onPointerDownGlobal, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerdown', onPointerDownGlobal);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [aspectRatio, displaySize]);

  // Export cropped image via HTML5 Canvas
  const handleApplyCrop = async () => {
    if (!naturalSize || displaySize.width <= 0 || displaySize.height <= 0) return;
    setProcessing(true);

    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const isFlipped = rotation === 90 || rotation === 270;
        const currentNaturalW = isFlipped ? naturalSize.height : naturalSize.width;
        const currentNaturalH = isFlipped ? naturalSize.width : naturalSize.height;

        const scaleX = currentNaturalW / displaySize.width;
        const scaleY = currentNaturalH / displaySize.height;

        const realX = Math.max(0, Math.round(cropBox.x * scaleX));
        const realY = Math.max(0, Math.round(cropBox.y * scaleY));
        const realW = Math.max(1, Math.min(currentNaturalW - realX, Math.round(cropBox.width * scaleX)));
        const realH = Math.max(1, Math.min(currentNaturalH - realY, Math.round(cropBox.height * scaleY)));

        // Temiz aynı-köken (blob) veya CORS uyumlu URL çözümle
        let workingUrl = safeUri || activeSourceUri;
        let tempBlobUrl: string | null = null;

        if (workingUrl.startsWith('http://') || workingUrl.startsWith('https://')) {
          try {
            const cacheBuster = (workingUrl.includes('?') ? '&' : '?') + '_cb=' + Date.now();
            const res = await fetch(workingUrl + cacheBuster, { mode: 'cors' });
            if (res.ok) {
              const blob = await res.blob();
              tempBlobUrl = URL.createObjectURL(blob);
              workingUrl = tempBlobUrl;
            }
          } catch (e) {
            console.warn('Apply crop fetch fallback:', e);
          }
        }

        const img = new window.Image();
        if (workingUrl.startsWith('http://') || workingUrl.startsWith('https://')) {
          img.crossOrigin = 'anonymous';
        }

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
          img.src = workingUrl;
        });

        const actualNaturalW = img.naturalWidth || currentNaturalW;
        const actualNaturalH = img.naturalHeight || currentNaturalH;

        // 1. Draw full rotated image
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = actualNaturalW;
        fullCanvas.height = actualNaturalH;
        const fullCtx = fullCanvas.getContext('2d');
        if (!fullCtx) throw new Error('Canvas context oluşturulamadı');

        fullCtx.translate(actualNaturalW / 2, actualNaturalH / 2);
        fullCtx.rotate((rotation * Math.PI) / 180);
        fullCtx.drawImage(img, -naturalSize.width / 2, -naturalSize.height / 2);

        // 2. Extract cropped area
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = realW;
        cropCanvas.height = realH;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) throw new Error('Crop context oluşturulamadı');

        cropCtx.drawImage(fullCanvas, realX, realY, realW, realH, 0, 0, realW, realH);

        await new Promise<void>((resolve, reject) => {
          cropCanvas.toBlob(
            (blob) => {
              if (tempBlobUrl) {
                URL.revokeObjectURL(tempBlobUrl);
              }
              if (!blob) {
                reject(new Error('Kırpılan görsel oluşturulamadı.'));
                return;
              }
              const croppedUri = URL.createObjectURL(blob);
              const safeName = fileName.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
              const croppedFile = new File([blob], safeName, { type: 'image/jpeg' });
              setProcessing(false);
              onSave(croppedUri, croppedFile);
              resolve();
            },
            'image/jpeg',
            0.92
          );
        });
      } else {
        // Fallback for native
        setProcessing(false);
        onSave(imageUri);
      }
    } catch (err) {
      console.error('Kırpma hatası:', err);
      toast.error(
        err instanceof Error ? err.message : 'Fotoğraf kırpılırken bir hata oluştu.',
        'Kırpma Hatası'
      );
      setProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="crop" size={17} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Fotoğrafı Kırp ve Düzenle</Text>
                <Text style={styles.headerSubtitle}>
                  Fotoğrafın görünmesini istediğiniz alanını seçin
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Viewport Area */}
          <View style={styles.viewportArea}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Fotoğraf yükleniyor...</Text>
              </View>
            ) : (
              <View
                ref={containerRef}
                style={[
                  styles.cropStage,
                  { width: displaySize.width, height: displaySize.height },
                ]}
              >
                {/* 1. Base Image & Shades (Strictly clipped to image container) */}
                <View style={styles.clippedMediaLayer}>
                  {Platform.OS === 'web' ? (
                    // @ts-ignore
                    <img
                      src={safeUri || activeSourceUri}
                      alt="Kırpılacak görsel"
                      draggable={false}
                      crossOrigin="anonymous"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <View style={{ width: '100%', height: '100%' }} />
                  )}

                  {/* Dark Shaded Regions around the crop box */}
                  <View
                    pointerEvents="none"
                    style={[
                      styles.shade,
                      { top: 0, left: 0, right: 0, height: cropBox.y },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      styles.shade,
                      {
                        top: cropBox.y + cropBox.height,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      styles.shade,
                      {
                        top: cropBox.y,
                        left: 0,
                        width: cropBox.x,
                        height: cropBox.height,
                      },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      styles.shade,
                      {
                        top: cropBox.y,
                        left: cropBox.x + cropBox.width,
                        right: 0,
                        height: cropBox.height,
                      },
                    ]}
                  />
                </View>

                {/* 2. Crop Box Overlay & Handles (overflow visible so handles are never clipped) */}
                <View
                  style={[
                    styles.cropBox,
                    {
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.width,
                      height: cropBox.height,
                    },
                  ]}
                  // @ts-ignore Web pointerdown for moving box
                  onPointerDown={(e: any) => {
                    e.stopPropagation();
                    e.preventDefault?.();
                    const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                    const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                    startDrag('move', cx, cy, e);
                  }}
                >
                  {/* Rule of Thirds Grid Lines */}
                  <View pointerEvents="none" style={styles.gridH1} />
                  <View pointerEvents="none" style={styles.gridH2} />
                  <View pointerEvents="none" style={styles.gridV1} />
                  <View pointerEvents="none" style={styles.gridV2} />

                  {/* Corner Handles with large 44x44 touch targets for mobile */}
                  <View
                    style={[styles.handleHitArea, styles.handleHitAreaTL]}
                    // @ts-ignore
                    onPointerDown={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault?.();
                      const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                      const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                      startDrag('tl', cx, cy, e);
                    }}
                  >
                    <View style={styles.handleDot} />
                  </View>

                  <View
                    style={[styles.handleHitArea, styles.handleHitAreaTR]}
                    // @ts-ignore
                    onPointerDown={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault?.();
                      const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                      const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                      startDrag('tr', cx, cy, e);
                    }}
                  >
                    <View style={styles.handleDot} />
                  </View>

                  <View
                    style={[styles.handleHitArea, styles.handleHitAreaBL]}
                    // @ts-ignore
                    onPointerDown={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault?.();
                      const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                      const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                      startDrag('bl', cx, cy, e);
                    }}
                  >
                    <View style={styles.handleDot} />
                  </View>

                  <View
                    style={[styles.handleHitArea, styles.handleHitAreaBR]}
                    // @ts-ignore
                    onPointerDown={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault?.();
                      const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                      const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                      startDrag('br', cx, cy, e);
                    }}
                  >
                    <View style={styles.handleDot} />
                  </View>

                  {/* Edge Handles with large 40px touch targets - Sadece Serbest modda gösterilir */}
                  {aspectRatio === 'FREE' && (
                    <>
                      <View
                        style={[styles.edgeHandleHitArea, styles.edgeHandleHitAreaT]}
                        // @ts-ignore
                        onPointerDown={(e: any) => {
                          e.stopPropagation();
                          e.preventDefault?.();
                          const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                          const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                          startDrag('t', cx, cy, e);
                        }}
                      >
                        <View style={styles.edgeBarH} />
                      </View>

                      <View
                        style={[styles.edgeHandleHitArea, styles.edgeHandleHitAreaB]}
                        // @ts-ignore
                        onPointerDown={(e: any) => {
                          e.stopPropagation();
                          e.preventDefault?.();
                          const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                          const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                          startDrag('b', cx, cy, e);
                        }}
                      >
                        <View style={styles.edgeBarH} />
                      </View>

                      <View
                        style={[styles.edgeHandleHitArea, styles.edgeHandleHitAreaL]}
                        // @ts-ignore
                        onPointerDown={(e: any) => {
                          e.stopPropagation();
                          e.preventDefault?.();
                          const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                          const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                          startDrag('l', cx, cy, e);
                        }}
                      >
                        <View style={styles.edgeBarV} />
                      </View>

                      <View
                        style={[styles.edgeHandleHitArea, styles.edgeHandleHitAreaR]}
                        // @ts-ignore
                        onPointerDown={(e: any) => {
                          e.stopPropagation();
                          e.preventDefault?.();
                          const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
                          const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
                          startDrag('r', cx, cy, e);
                        }}
                      >
                        <View style={styles.edgeBarV} />
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Controls Bar: Presets & Tools */}
          <View style={styles.controlsBar}>
            <View style={styles.presetsRow}>
              {PRESETS.map((preset) => {
                const isActive = aspectRatio === preset.key;
                return (
                  <Pressable
                    key={preset.key}
                    onPress={() => handleSelectPreset(preset.key)}
                    style={[
                      styles.presetPill,
                      isActive && styles.presetPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        isActive && styles.presetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Orijinal / Kırpılmış Görsel Geçişi */}
            {Boolean(originalUri && originalUri !== imageUri) && (
              <Pressable
                onPress={() =>
                  setActiveSourceUri((prev) =>
                    prev === originalUri ? imageUri : (originalUri ?? imageUri)
                  )
                }
                style={[
                  styles.sourceTogglePill,
                  activeSourceUri === originalUri && styles.sourceTogglePillActive,
                ]}
                hitSlop={6}
              >
                <Ionicons
                  name={activeSourceUri === originalUri ? 'checkmark-circle' : 'refresh-outline'}
                  size={14}
                  color={activeSourceUri === originalUri ? '#22c55e' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.sourceToggleText,
                    activeSourceUri === originalUri && styles.sourceToggleTextActive,
                  ]}
                >
                  {activeSourceUri === originalUri ? 'Orijinal Fotoğraf Açık' : 'Orijinalden Kırp'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={processing}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>İptal</Text>
            </Pressable>

            <Pressable
              onPress={handleApplyCrop}
              disabled={processing || loading}
              style={[
                styles.saveBtn,
                (processing || loading) && { opacity: 0.6 },
              ]}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={17} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Kırp ve Uygula</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
      default: {},
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#151821',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportArea: {
    minHeight: 320,
    maxHeight: 440,
    backgroundColor: '#0a0d14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        touchAction: 'none' as any,
        userSelect: 'none' as any,
      },
      default: {},
    }),
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  cropStage: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 6,
    ...Platform.select({
      web: {
        touchAction: 'none' as any,
        userSelect: 'none' as any,
      },
      default: {},
    }),
  },
  clippedMediaLayer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 6,
    backgroundColor: '#05070a',
  },
  shade: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      web: {
        cursor: 'move' as any,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.3)',
        touchAction: 'none' as any,
        userSelect: 'none' as any,
      },
      default: {},
    }),
  },
  gridH1: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  gridH2: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  gridV1: {
    position: 'absolute',
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  gridV2: {
    position: 'absolute',
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  // Generous 44x44 touch hit area for corners on mobile
  handleHitArea: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    ...Platform.select({
      web: {
        touchAction: 'none' as any,
        userSelect: 'none' as any,
      },
      default: {},
    }),
  },
  handleHitAreaTL: {
    top: -22,
    left: -22,
    ...Platform.select({
      web: { cursor: 'nwse-resize' as any },
      default: {},
    }),
  },
  handleHitAreaTR: {
    top: -22,
    right: -22,
    ...Platform.select({
      web: { cursor: 'nesw-resize' as any },
      default: {},
    }),
  },
  handleHitAreaBL: {
    bottom: -22,
    left: -22,
    ...Platform.select({
      web: { cursor: 'nesw-resize' as any },
      default: {},
    }),
  },
  handleHitAreaBR: {
    bottom: -22,
    right: -22,
    ...Platform.select({
      web: { cursor: 'nwse-resize' as any },
      default: {},
    }),
  },
  handleDot: {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#0f172a',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
      },
      default: {
        elevation: 6,
      },
    }),
  },
  // Generous 40px touch hit area for edges on mobile
  edgeHandleHitArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...Platform.select({
      web: {
        touchAction: 'none' as any,
        userSelect: 'none' as any,
      },
      default: {},
    }),
  },
  edgeHandleHitAreaT: {
    top: -20,
    left: 24,
    right: 24,
    height: 40,
    ...Platform.select({
      web: { cursor: 'ns-resize' as any },
      default: {},
    }),
  },
  edgeHandleHitAreaB: {
    bottom: -20,
    left: 24,
    right: 24,
    height: 40,
    ...Platform.select({
      web: { cursor: 'ns-resize' as any },
      default: {},
    }),
  },
  edgeHandleHitAreaL: {
    left: -20,
    top: 24,
    bottom: 24,
    width: 40,
    ...Platform.select({
      web: { cursor: 'ew-resize' as any },
      default: {},
    }),
  },
  edgeHandleHitAreaR: {
    right: -20,
    top: 24,
    bottom: 24,
    width: 40,
    ...Platform.select({
      web: { cursor: 'ew-resize' as any },
      default: {},
    }),
  },
  edgeBarH: {
    width: 34,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.5)' },
      default: {},
    }),
  },
  edgeBarV: {
    width: 6,
    height: 34,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.5)' },
      default: {},
    }),
  },
  controlsBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
        transition: 'all 160ms ease',
      },
      default: {},
    }),
  },
  presetPillActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  presetTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12141c',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.card,
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#94a3b8',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.card,
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
        boxShadow: '0 2px 10px rgba(34, 197, 94, 0.35)',
      },
      default: {},
    }),
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  sourceTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: { cursor: 'pointer' as const, transition: 'all 160ms ease' },
      default: {},
    }),
  },
  sourceTogglePillActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  sourceToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sourceToggleTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
});
