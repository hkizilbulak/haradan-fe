import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickLocalImages } from '@/services/media';
import { MAX_LISTING_IMAGES, type ListingMediaSlot } from '@/types/listing';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const [localError, setLocalError] = useState<string | null>(null);
  const remaining = MAX_LISTING_IMAGES - items.length;
  const activeError = localError || error;

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
          <View style={styles.grid}>
            {items.map((slot) => (
              <View key={slot.localId} style={[styles.cell, { backgroundColor: surface, borderColor: border }]}>
                <Image source={{ uri: slot.uri }} style={styles.image} resizeMode="cover" />

                {/* Cover badge or button */}
                <Pressable
                  onPress={() => onSetCover(slot.localId)}
                  style={[
                    styles.coverBadge,
                    {
                      backgroundColor: slot.isCover ? header : 'rgba(12, 12, 14, 0.65)',
                    },
                  ]}
                  hitSlop={4}
                  accessibilityLabel={slot.isCover ? 'Kapak fotoğrafı' : 'Kapak yap'}
                >
                  <Ionicons
                    name={slot.isCover ? 'star' : 'star-outline'}
                    size={11}
                    color="#fff"
                  />
                  <Text style={styles.coverBadgeText}>
                    {slot.isCover ? 'Kapak' : 'Kapak Yap'}
                  </Text>
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
                : `${items.length} fotoğraf yüklendi. İstediğiniz görseli kapak yapabilirsiniz.`}
            </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
    gap: 10,
  },
  cell: {
    width: '31%',
    minWidth: 96,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
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
  },
  addSlot: {
    width: '31%',
    minWidth: 96,
    aspectRatio: 1,
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
