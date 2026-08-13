import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from '@/components/product/RatingStars';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import { WHATSAPP_GREEN } from '@/utils/contactLinks';
import type { AdvertDetail } from '@/types';

type AdvertStickyCtaProps = {
  detail: AdvertDetail;
  favorite: boolean;
  isOwner?: boolean;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
};

export const AdvertStickyCta = memo(function AdvertStickyCta({
  detail,
  favorite,
  isOwner = false,
  onCall,
  onWhatsApp,
  onToggleFavorite,
  onEdit,
}: AdvertStickyCtaProps) {
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');
  const skeleton = useThemeColor('skeleton');

  const pressMotion = (pressed: boolean) => ({
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
    ...Platform.select({
      web: {
        transition: 'transform 160ms ease, opacity 160ms ease',
        cursor: 'pointer' as const,
      },
      default: {},
    }),
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surface,
          borderColor: border,
        },
      ]}
    >
      <Image
        source={detail.cover?.publicUrl ?? detail.gallery[0]?.publicUrl}
        style={[styles.thumb, { backgroundColor: skeleton }]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <RatingStars value={detail.rating} count={detail.reviewCount} size={13} />
      <Text style={[styles.title, { color: text }]} numberOfLines={2}>
        {detail.title}
      </Text>
      <Text style={[styles.price, { color: text }]}>
        {formatMoney(detail.price)}
      </Text>

      {isOwner ? (
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="İlanı düzenle"
          style={({ pressed }) => [
            styles.editBtn,
            { borderColor: header },
            pressMotion(pressed),
          ]}
        >
          <Ionicons name="create-outline" size={16} color={header} />
          <Text style={[styles.editText, { color: header }]}>İlanı düzenle</Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={onCall}
          accessibilityRole="button"
          accessibilityLabel="Ara"
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: header },
            pressMotion(pressed),
          ]}
        >
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.ctaText}>Ara</Text>
        </Pressable>
        <Pressable
          onPress={onWhatsApp}
          accessibilityRole="button"
          accessibilityLabel="WhatsApp ile iletişime geç"
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: WHATSAPP_GREEN },
            pressMotion(pressed),
          ]}
        >
          <Ionicons name="logo-whatsapp" size={17} color="#fff" />
          <Text style={styles.ctaText}>WhatsApp</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={onToggleFavorite}
          style={[styles.iconBtn, { borderColor: border }]}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={favorite ? '#e11d48' : text}
          />
        </Pressable>
        <Pressable style={[styles.iconBtn, { borderColor: border }]}>
          <Ionicons name="git-compare-outline" size={18} color={text} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.sheet,
    padding: Spacing.md,
    gap: 10,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: Radius.card,
  },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  price: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  editBtn: {
    minHeight: 44,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editText: { fontWeight: '700', fontSize: 13 },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cta: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    flex: 1,
    height: 42,
    borderRadius: Radius.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
