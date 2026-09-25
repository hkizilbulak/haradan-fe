import React, { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickLocalImages } from '@/services/media';
import { MAX_LISTING_IMAGES, type ListingMediaSlot } from '@/types/listing';
import { ImageCropperModal } from './ImageCropperModal';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

// Web İlan Detay Galerisi kalıbı (694.6 / 440 ≈ 1.5786)
const WEB_GALLERY_ASPECT_RATIO = 694.6 / 440;
const GAP = 10;

type PostMediaGridProps = {
  items: ListingMediaSlot[];
  error?: string | null;
  onChange: (next: ListingMediaSlot[]) => void;
  onSetCover: (localId: string) => void;
};

export function PostMediaGrid({
  items,
  error,
  onChange,
  onSetCover,
}: PostMediaGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && Math.abs(w - containerWidth) > 1) {
      setContainerWidth(w);
    }
  };

  // Web / geniş ekranda 1 satırda 3 tane, mobilde 1 satırda 2 tane
  const isWide = containerWidth > 0 ? containerWidth >= 520 : windowWidth >= 640;
  const cols = isWide ? 3 : 2;

  const colWidth =
    containerWidth > 0
      ? Math.max(80, Math.floor((containerWidth - GAP * (cols - 1) - 2) / cols))
      : 0;

  const webItemWidth = isWide
    ? `calc((100% - ${GAP * 2}px) / 3 - 0.5px)`
    : `calc(50% - ${GAP / 2 + 1}px)`;

  const itemStyle: ViewStyle = Platform.select({
    web: {
      width: webItemWidth as any,
      maxWidth: webItemWidth as any,
      flexBasis: webItemWidth as any,
    },
    default: {
      width: (colWidth > 0 ? colWidth : isWide ? '31%' : '48%') as DimensionValue,
    },
  }) as ViewStyle;

  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const [localError, setLocalError] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<ListingMediaSlot | null>(null);
  const remaining = MAX_LISTING_IMAGES - items.length;
  const activeError = localError || error;

  const handleCropSave = (croppedUri: string, croppedFile?: File) => {
    if (!editingSlot) return;
    const updated = items.map((item) => {
      if (item.localId === editingSlot.localId) {
        return {
          ...item,
          uri: croppedUri,
          file: croppedFile || item.file,
          originalUri: item.originalUri || item.uri,
          originalFile: item.originalFile || item.file,
          mimeType: 'image/jpeg',
          assetId: null,
        };
      }
      return item;
    });
    onChange(updated);
    setEditingSlot(null);
  };

  const add = async () => {
    setLocalError(null);
    const result = await pickLocalImages(remaining);
    if (result.error) {
      setLocalError(result.error);
    }
    if (result.items.length === 0) return;
    const next = [
      ...items,
      ...result.items.map((p, i) => ({
        ...p,
        originalUri: p.uri,
        originalFile: p.file,
        isCover: items.length === 0 && i === 0,
        assetId: null,
      })),
    ];
    onChange(next);
  };

  const remove = (localId: string) => {
    setLocalError(null);
    const filtered = items.filter((m) => m.localId !== localId);
    if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
      filtered[0] = { ...filtered[0], isCover: true };
    }
    onChange(filtered);
  };

  return (
    <View style={styles.wrap}>
      {/* ─── CASE 1: No photos uploaded yet ─── */}
      {items.length === 0 ? (
        <Pressable
          onPress={add}
          style={({ pressed }) => [
            styles.dropzone,
            {
              borderColor: activeError ? errorColor : border,
              backgroundColor: pressed ? border + '25' : surface,
            },
          ]}
          accessibilityLabel="Fotoğraf yükle"
        >
          <View style={[styles.iconCircle, { backgroundColor: header + '18' }]}>
            <Ionicons name="images-outline" size={28} color={header} />
          </View>
          <Text style={[styles.dropzoneTitle, { color: text }]}>
            Fotoğraf Yüklemek İçin Dokunun
          </Text>
          <Text style={[styles.dropzoneSubtitle, { color: secondary }]}>
            JPEG, PNG veya WebP · En fazla 5 fotoğraf
          </Text>
          <View style={[styles.uploadPill, { backgroundColor: header }]}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.uploadPillText}>Fotoğraf Seç</Text>
          </View>
        </Pressable>
      ) : (
        /* ─── CASE 2: Photos exist ─── */
        <>
          <View style={styles.grid} onLayout={handleLayout}>
            {items.map((slot) => (
              <View
                key={slot.localId}
                style={[
                  styles.cell,
                  itemStyle,
                  {
                    backgroundColor: '#0a0d14',
                    borderColor: border,
                  },
                ]}
              >
                {/* Bokeh backdrop for non-standard aspect ratio photos */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Image
                    source={{ uri: slot.uri }}
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        transform: [{ scale: 1.25 }],
                        opacity: 0.85,
                        ...(Platform.OS === 'web' ? ({ filter: 'blur(16px)' } as any) : {}),
                      },
                    ]}
                    resizeMode="cover"
                    blurRadius={Platform.OS === 'web' ? 16 : 12}
                  />
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.25)' }]} />
                </View>

                {/* Net fotoğraf - contain ile ilandaki gibi tam kadraj */}
                <Image source={{ uri: slot.uri }} style={styles.image} resizeMode="contain" />

                {/* Edit / Crop button */}
                <Pressable
                  onPress={() => setEditingSlot(slot)}
                  style={styles.editBtn}
                  hitSlop={6}
                  accessibilityLabel="Fotoğrafı kırp ve düzenle"
                >
                  <Ionicons name="crop" size={12} color="#fff" />
                </Pressable>

                {/* Cover badge or button */}
                <Pressable
                  onPress={() => onSetCover(slot.localId)}
                  style={[
                    styles.coverBadge,
                    {
                      backgroundColor: slot.isCover ? header : 'rgba(12, 12, 14, 0.65)',
                    },
                    !slot.isCover && styles.coverBtnUnselected,
                  ]}
                  hitSlop={6}
                  accessibilityLabel={slot.isCover ? 'Kapak fotoğrafı' : 'Kapak yap'}
                >
                  <Ionicons
                    name={slot.isCover ? 'star' : 'star-outline'}
                    size={slot.isCover ? 11 : 13}
                    color="#fff"
                  />
                  {slot.isCover ? (
                    <Text style={styles.coverBadgeText} numberOfLines={1}>
                      Kapak
                    </Text>
                  ) : null}
                </Pressable>

                {/* Delete button */}
                <Pressable
                  onPress={() => remove(slot.localId)}
                  style={styles.removeBtn}
                  hitSlop={6}
                  accessibilityLabel="Görseli sil"
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}

            {/* Single Add Slot if not full */}
            {remaining > 0 ? (
              <Pressable
                onPress={add}
                style={({ pressed }) => [
                  styles.addSlot,
                  itemStyle,
                  {
                    borderColor: activeError ? errorColor : border,
                    backgroundColor: pressed ? border + '25' : surface,
                  },
                ]}
                accessibilityLabel="Fotoğraf ekle"
              >
                <View style={[styles.addSlotIcon, { backgroundColor: header + '15' }]}>
                  <Ionicons name="add" size={20} color={header} />
                </View>
                <Text style={[styles.addSlotLabel, { color: text }]}>Ekle</Text>
                <Text style={[styles.addSlotCounter, { color: secondary }]}>
                  ({items.length}/{MAX_LISTING_IMAGES})
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Bottom helper text */}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={14} color={muted} />
            <Text style={[styles.infoText, { color: secondary }]}>
              {items.length === 1
                ? '1 fotoğraf seçildi (varsayılan kapak fotoğrafı).'
                : `${items.length} fotoğraf yüklendi.`}
            </Text>
          </View>

          {/* Icon legend / meanings */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendIconCircle}>
                <Ionicons name="crop" size={11} color="#fff" />
              </View>
              <Text style={[styles.legendText, { color: secondary }]}>Düzenle / Kırp</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendIconCircle}>
                <Ionicons name="star-outline" size={11} color="#fff" />
              </View>
              <Text style={[styles.legendText, { color: secondary }]}>Kapak Yap</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendIconCircle}>
                <Ionicons name="close" size={11} color="#fff" />
              </View>
              <Text style={[styles.legendText, { color: secondary }]}>Sil</Text>
            </View>
          </View>
        </>
      )}

      {/* Error text */}
      {activeError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={errorColor} />
          <Text style={[styles.errorText, { color: errorColor }]}>{activeError}</Text>
        </View>
      ) : null}

      {/* Image Cropper Modal */}
      {editingSlot && (
        <ImageCropperModal
          visible={Boolean(editingSlot)}
          imageUri={editingSlot.uri}
          originalUri={editingSlot.originalUri}
          fileName={editingSlot.fileName}
          onClose={() => setEditingSlot(null)}
          onSave={handleCropSave}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: Spacing.sm,
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropzoneTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  dropzoneSubtitle: {
    ...Typography.caption,
    fontSize: 12.5,
  },
  uploadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    marginTop: 8,
  },
  uploadPillText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    width: '100%',
  },
  cell: {
    aspectRatio: WEB_GALLERY_ASPECT_RATIO,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    backgroundColor: '#0a0d14',
  },
  editBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 12, 14, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
        transition: 'background-color 150ms ease',
      },
      default: {},
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  coverBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
    maxWidth: '75%',
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
      },
      default: {},
    }),
  },
  coverBtnUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadgeText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 12, 14, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  addSlot: {
    aspectRatio: WEB_GALLERY_ASPECT_RATIO,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  addSlotIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  addSlotCounter: {
    ...Typography.caption,
    fontSize: 10.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    ...Typography.caption,
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(12, 12, 14, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    ...Typography.caption,
    fontSize: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    ...Typography.caption,
    fontSize: 12,
  },
});
