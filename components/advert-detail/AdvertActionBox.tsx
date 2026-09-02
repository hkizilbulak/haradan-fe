import React, { memo } from 'react';
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
import { WHATSAPP_GREEN } from '@/utils/contactLinks';
import type { AdvertDetail } from '@/types';

type AdvertActionBoxProps = {
  detail: AdvertDetail;
  favorite: boolean;
  isOwner?: boolean;
  onToggleFavorite?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEdit?: () => void;
};

/** Fotoğraf altındaki aksiyon ve konum/fiyat kutusu. */
export const AdvertActionBox = memo(function AdvertActionBox({
  detail,
  favorite,
  isOwner = false,
  onToggleFavorite,
  onCall,
  onWhatsApp,
  onEdit,
}: AdvertActionBoxProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const isSold = detail.backendStatus === 'SOLD';
  const location = useAdvertLocation(detail);

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
    <View style={[styles.wrap, { backgroundColor: surface, borderColor: border }]}>
      <View style={styles.headerRow}>
        <View style={styles.locationWrap}>
          <Ionicons name="location-outline" size={17} color={textMuted} />
          <Text style={[styles.locationText, { color: textMuted }]} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.priceWrap}>
          <Text style={[styles.price, { color: text }]}>
            {formatMoney(detail.price)}
          </Text>
          {detail.oldPrice ? (
            <Text style={[styles.oldPrice, { color: textMuted }]}>
              {formatMoney(detail.oldPrice)}
            </Text>
          ) : null}
        </View>
      </View>

      {detail.address ? (
        <View style={styles.addressRow}>
          <Ionicons name="map-outline" size={13} color={textMuted} />
          <Text style={[styles.addressText, { color: textMuted }]} numberOfLines={2}>
            {detail.address}
          </Text>
        </View>
      ) : null}

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
          <Ionicons name="create-outline" size={18} color={header} />
          <Text style={[styles.editText, { color: header }]}>İlanı düzenle</Text>
        </Pressable>
      ) : null}

      <View style={styles.actionsRow}>
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

        <Pressable
          onPress={onToggleFavorite}
          accessibilityLabel="Favorilere ekle"
          hitSlop={6}
          style={({ pressed }) => [
            styles.favBtn,
            { borderColor: border, backgroundColor: surface },
            pressMotion(pressed),
          ]}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={favorite ? '#e11d48' : textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    gap: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  priceWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  oldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -4,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editBtn: {
    minHeight: 46,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editText: { fontWeight: '700', fontSize: 14 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
