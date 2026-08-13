import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const primary = useThemeColor('primary');
  const errorColor = useThemeColor('error');
  const remaining = MAX_LISTING_IMAGES - items.length;

  const add = async () => {
    const picked = await pickLocalImages(remaining);
    if (picked.length === 0) return;
    const next = [
      ...items,
      ...picked.map((p, i) => ({
        ...p,
        isCover: items.length === 0 && i === 0,
        assetId: null,
      })),
    ];
    onChange(next);
  };

  const remove = (localId: string) => {
    const filtered = items.filter((m) => m.localId !== localId);
    if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
      filtered[0] = { ...filtered[0], isCover: true };
    }
    onChange(filtered);
  };

  const slots = Array.from({ length: MAX_LISTING_IMAGES }, (_, i) => items[i] ?? null);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: text }]}>Görseller</Text>
      <Text style={[styles.hint, { color: secondary }]}>
        En fazla 5 fotoğraf. Birini kapak olarak işaretleyin.
      </Text>
      <View style={styles.grid}>
        {slots.map((slot, index) =>
          slot ? (
            <View key={slot.localId} style={styles.cell}>
              <Image source={{ uri: slot.uri }} style={styles.image} resizeMode="cover" />
              <Pressable
                onPress={() => onSetCover(slot.localId)}
                style={[
                  styles.coverBtn,
                  {
                    backgroundColor: slot.isCover ? primary : 'rgba(12,12,14,0.55)',
                  },
                ]}
                accessibilityLabel={slot.isCover ? 'Kapak görseli' : 'Kapak yap'}
              >
                <Text style={styles.coverLabel}>
                  {slot.isCover ? 'Kapak' : 'Kapak yap'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => remove(slot.localId)}
                style={styles.remove}
                accessibilityLabel="Görseli sil"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={`empty-${index}`}
              onPress={remaining > 0 ? add : undefined}
              style={({ pressed }) => [
                styles.empty,
                {
                  borderColor: error ? errorColor : border,
                  backgroundColor: surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel="Görsel ekle"
            >
              <Ionicons name="add" size={22} color={secondary} />
              <Text style={[styles.emptyLabel, { color: secondary }]}>
                Ekle
              </Text>
            </Pressable>
          )
        )}
      </View>
      {error ? (
        <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...Typography.small, fontWeight: '600' },
  hint: { ...Typography.caption },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cell: {
    width: '31%',
    minWidth: 96,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  coverBtn: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coverLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(12,12,14,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    width: '31%',
    minWidth: 96,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyLabel: { ...Typography.caption, fontWeight: '600' },
  error: { ...Typography.caption },
});
