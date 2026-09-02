import React, { memo, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAdvertLocation } from '@/services/location';
import { formatMoney } from '@/utils/formatMoney';
import { formatViewCount } from '@/utils/formatViewCount';
import { WHATSAPP_GREEN } from '@/utils/contactLinks';
import type { AdvertDetail } from '@/types';
import { getAdvertCategoryKind } from './advertCategoryHelper';

type AdvertBuyBoxProps = {
  detail: AdvertDetail;
  favorite: boolean;
  isOwner?: boolean;
  variant?: 'default' | 'mobile';
  onToggleFavorite?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEdit?: () => void;
};

/** Görsel yanı — çerçevesiz, minimalist özet. */
export const AdvertBuyBox = memo(function AdvertBuyBox({
  detail,
  favorite,
  isOwner = false,
  variant = 'default',
  onToggleFavorite,
  onCall,
  onWhatsApp,
  onEdit,
}: AdvertBuyBoxProps) {
  const isMobile = variant === 'mobile';
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');
  const success = useThemeColor('success');

  const categoryKind = getAdvertCategoryKind(detail);
  const isSold = detail.backendStatus === 'SOLD';

  const location = useAdvertLocation(detail);

  const categoryBadge = useMemo(() => {
    switch (categoryKind) {
      case 'pansiyon':
        return 'Pansiyon Haralar';
      case 'transport':
        return 'At Nakliyesi';
      case 'farrier':
        return 'Nalbantlar';
      case 'stud':
        return 'Aşım Hizmetleri';
      default:
        return detail.horse.breed || 'Satılık At';
    }
  }, [categoryKind, detail.horse.breed]);

  const pressMotion = (pressed: boolean) => ({
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.985 : 1 }],
    ...Platform.select({
      web: {
        transition: 'transform 180ms ease, opacity 180ms ease',
        cursor: 'pointer' as const,
      },
      default: {},
    }),
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        <Text style={[styles.breed, { color: textMuted }]}>{categoryBadge}</Text>
        {detail.isUrgent ? (
          <Text style={styles.urgent}>ACİL</Text>
        ) : null}
      </View>

      {!isMobile ? (
        <Text style={[styles.name, { color: text }]} numberOfLines={2}>
          {detail.title}
        </Text>
      ) : null}

      {!isMobile ? (
        <View style={styles.subRow}>
          <Ionicons name="location-outline" size={13} color={textMuted} />
          <Text style={[styles.sub, { color: textMuted }]}>{location}</Text>
          <View style={[styles.dot, { backgroundColor: textMuted }]} />
          <Ionicons name="eye-outline" size={13} color={textMuted} />
          <Text style={[styles.sub, { color: textMuted }]}>
            {formatViewCount(detail.viewCount)}
          </Text>
        </View>
      ) : null}
      {detail.address ? (
        <View style={[styles.subRow, { marginTop: 4 }]}>
          <Ionicons name="map-outline" size={13} color={textMuted} />
          <Text style={[styles.sub, { color: textMuted }]} numberOfLines={2}>
            {detail.address}
          </Text>
        </View>
      ) : null}

      {detail.description ? (
        <View style={styles.descBlock}>
          <Text style={[styles.blockLabel, { color: textMuted }]}>
            İlan açıklaması
          </Text>
          <Text style={[styles.desc, { color: textSecondary }]}>
            {detail.description}
          </Text>
        </View>
      ) : null}

      {!isMobile ? (
        <View style={styles.priceBlock}>
          <Text style={[styles.price, { color: text }]}>
            {formatMoney(detail.price)}
          </Text>
          {detail.oldPrice ? (
            <Text style={[styles.old, { color: textMuted }]}>
              {formatMoney(detail.oldPrice)}
            </Text>
          ) : null}
          {detail.available ? (
            <Text style={[styles.open, { color: success }]}>İlana açık</Text>
          ) : null}
        </View>
      ) : null}

      {!isMobile && isOwner ? (
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
          <Ionicons name="create-outline" size={18} color={header} />
          <Text style={[styles.editText, { color: header }]}>İlanı düzenle</Text>
        </Pressable>
      ) : null}

      {!isMobile ? (
        <View style={styles.actions}>
          <Pressable
            onPress={isSold ? undefined : onCall}
            disabled={isSold}
            accessibilityRole="button"
            accessibilityLabel="Ara"
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: isSold ? '#9ca3af' : header },
              !isSold && pressMotion(pressed),
            ]}
          >
            <Ionicons name="call" size={17} color="#fff" />
            <Text style={styles.ctaText}>{isSold ? 'Satıldı' : 'Ara'}</Text>
          </Pressable>

          <Pressable
            onPress={isSold ? undefined : onWhatsApp}
            disabled={isSold}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp ile iletişime geç"
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: isSold ? '#9ca3af' : WHATSAPP_GREEN },
              !isSold && pressMotion(pressed),
            ]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.ctaText}>WhatsApp</Text>
          </Pressable>
        </View>
      ) : null}

      {!isMobile ? (
        <View style={styles.iconRow}>
          <Pressable
            onPress={onToggleFavorite}
            accessibilityLabel="Favorilere ekle"
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? '#e11d48' : textMuted}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Karşılaştır"
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Ionicons name="git-compare-outline" size={20} color={textMuted} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breed: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  urgent: {
    color: '#e11d48',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.45,
    lineHeight: 30,
    marginTop: -4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -6,
  },
  sub: { fontSize: 12, fontWeight: '500' },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
    marginHorizontal: 2,
  },
  descBlock: { gap: 6 },
  blockLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  price: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  old: { fontSize: 14, textDecorationLine: 'line-through' },
  open: { fontSize: 12, fontWeight: '600' },
  editBtn: {
    minHeight: 48,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editText: { fontWeight: '700', fontSize: 14 },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  cta: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    paddingVertical: 2,
  },
});
