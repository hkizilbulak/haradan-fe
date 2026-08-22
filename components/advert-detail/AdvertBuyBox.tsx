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
import {
  getAdvertCategoryKind,
  parsePansiyonInfo,
  parseStudInfo,
  parseTransportInfo,
} from './advertCategoryHelper';

type AdvertBuyBoxProps = {
  detail: AdvertDetail;
  favorite: boolean;
  isOwner?: boolean;
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
  onToggleFavorite,
  onCall,
  onWhatsApp,
  onEdit,
}: AdvertBuyBoxProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');
  const success = useThemeColor('success');

  const categoryKind = getAdvertCategoryKind(detail);
  const isSold = detail.backendStatus === 'SOLD';

  const location = useAdvertLocation(detail);

  const studInfo = useMemo(() => parseStudInfo(detail), [detail]);
  const pansiyonInfo = useMemo(() => parsePansiyonInfo(detail), [detail]);
  const transportInfo = useMemo(() => parseTransportInfo(detail), [detail]);

  const categoryBadge = useMemo(() => {
    switch (categoryKind) {
      case 'pansiyon':
        return 'Pansiyon Haralar';
      case 'transport':
        return 'At Nakliyesi';
      case 'farrier':
        return 'Nalbantlar';
      case 'stud':
        return studInfo.breed ? `Aşım Hizmetleri (${studInfo.breed})` : 'Aşım Hizmetleri';
      default:
        return detail.horse.breed || 'Satılık At';
    }
  }, [categoryKind, studInfo.breed, detail.horse.breed]);

  const facts = useMemo(() => {
    if (categoryKind === 'pansiyon') {
      const list: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
      if (pansiyonInfo.hasGrassPaddock) list.push({ icon: 'leaf-outline', label: 'Tesis', value: 'Çim Padok' });
      if (pansiyonInfo.hasSandPaddock) list.push({ icon: 'grid-outline', label: 'Tesis', value: 'Kum Padok' });
      if (pansiyonInfo.hasStallionPaddock) list.push({ icon: 'shield-outline', label: 'Tesis', value: 'Aygır Padoğu' });
      if (pansiyonInfo.hasVeterinarian) list.push({ icon: 'medkit-outline', label: 'Sağlık', value: 'Veteriner' });
      if (pansiyonInfo.hasFarrier) list.push({ icon: 'hammer-outline', label: 'Bakım', value: 'Nalbant' });
      if (pansiyonInfo.hasFoalingBarn) list.push({ icon: 'home-outline', label: 'Tesis', value: 'Doğumhane' });
      if (pansiyonInfo.trainingTrack) list.push({ icon: 'fitness-outline', label: 'Pist', value: pansiyonInfo.trainingTrack });
      return list.slice(0, 4);
    }
    if (categoryKind === 'transport') {
      const list: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
      if (transportInfo.companyName) list.push({ icon: 'business-outline', label: 'Firma', value: transportInfo.companyName });
      if (transportInfo.websiteUrl) list.push({ icon: 'globe-outline', label: 'Web', value: transportInfo.websiteUrl });
      return list;
    }
    if (categoryKind === 'farrier') {
      // Nalbantlar kategorisinde PDF'e göre ek spec/çip alanı yoktur
      return [];
    }
    if (categoryKind === 'stud') {
      const list: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
      if (studInfo.breed) list.push({ icon: 'ribbon-outline', label: 'Irk', value: studInfo.breed });
      if (studInfo.age) list.push({ icon: 'calendar-outline', label: 'Yaş', value: studInfo.age.includes('ya') || studInfo.age.includes('Ya') ? studInfo.age : `${studInfo.age} Yaş` });
      if (studInfo.coatColor) list.push({ icon: 'color-palette-outline', label: 'Don', value: studInfo.coatColor });
      if (studInfo.sire) list.push({ icon: 'git-branch-outline', label: 'Baba', value: studInfo.sire });
      return list;
    }
    const list: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
    if (detail.horse.age > 0) list.push({ icon: 'calendar-outline', label: 'Yaş', value: `${detail.horse.age} Yaş` });
    if (detail.horse.gender) list.push({ icon: 'male-female-outline', label: 'Cinsiyet', value: detail.horse.gender });
    if (detail.horse.coatColor) list.push({ icon: 'color-palette-outline', label: 'Don', value: detail.horse.coatColor });
    if (detail.horse.handicap > 0) list.push({ icon: 'speedometer-outline', label: 'Handikap', value: String(detail.horse.handicap) });
    return list;
  }, [categoryKind, pansiyonInfo, transportInfo, studInfo, detail.horse]);

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

      <Text style={[styles.name, { color: text }]} numberOfLines={2}>
        {detail.title}
      </Text>

      <View style={styles.subRow}>
        <Ionicons name="location-outline" size={13} color={textMuted} />
        <Text style={[styles.sub, { color: textMuted }]}>{location}</Text>
        <View style={[styles.dot, { backgroundColor: textMuted }]} />
        <Ionicons name="eye-outline" size={13} color={textMuted} />
        <Text style={[styles.sub, { color: textMuted }]}>
          {formatViewCount(detail.viewCount)}
        </Text>
      </View>
      {detail.address ? (
        <View style={[styles.subRow, { marginTop: 4 }]}>
          <Ionicons name="map-outline" size={13} color={textMuted} />
          <Text style={[styles.sub, { color: textMuted }]} numberOfLines={2}>
            {detail.address}
          </Text>
        </View>
      ) : null}

      {facts.length > 0 ? (
        <View style={styles.facts}>
          {facts.map((f) => (
            <View key={f.label} style={styles.fact}>
              <Ionicons name={f.icon} size={15} color={textSecondary} />
              <View style={styles.factCopy}>
                <Text style={[styles.factLabel, { color: textMuted }]}>{f.label}</Text>
                <Text style={[styles.factValue, { color: text }]}>{f.value}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {categoryKind === 'stud' ? (
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: textMuted }]}>Aygır ve Soy Kütüğü</Text>
          {studInfo.breed ? <InfoLine label="At Irkı" value={studInfo.breed} text={text} muted={textMuted} /> : null}
          {studInfo.age ? <InfoLine label="Yaş" value={studInfo.age} text={text} muted={textMuted} /> : null}
          {studInfo.coatColor ? <InfoLine label="Donu" value={studInfo.coatColor} text={text} muted={textMuted} /> : null}
          {studInfo.sire ? <InfoLine label="Baba (Sire)" value={studInfo.sire} text={text} muted={textMuted} /> : null}
          {studInfo.dam ? <InfoLine label="Anne (Dam)" value={studInfo.dam} text={text} muted={textMuted} /> : null}
        </View>
      ) : categoryKind === 'pansiyon' ? (
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: textMuted }]}>Tesis & Hizmet Özellikleri</Text>
          <InfoLine label="Çim Padok" value={pansiyonInfo.hasGrassPaddock ? 'Mevcut' : 'Yok'} text={text} muted={textMuted} />
          <InfoLine label="Kum Padok" value={pansiyonInfo.hasSandPaddock ? 'Mevcut' : 'Yok'} text={text} muted={textMuted} />
          <InfoLine label="Veteriner Hekim" value={pansiyonInfo.hasVeterinarian ? 'Mevcut' : 'Yok'} text={text} muted={textMuted} />
          {pansiyonInfo.trainingTrack ? (
            <InfoLine label="İdman Pisti" value={pansiyonInfo.trainingTrack} text={text} muted={textMuted} />
          ) : null}
        </View>
      ) : categoryKind === 'transport' ? (
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: textMuted }]}>Firma Bilgileri</Text>
          <InfoLine label="Firma Adı" value={transportInfo.companyName} text={text} muted={textMuted} />
          {transportInfo.websiteUrl ? (
            <InfoLine label="Web Sitesi" value={transportInfo.websiteUrl} text={text} muted={textMuted} />
          ) : null}
          <InfoLine label="Hizmet" value="At Nakliyesi & Taşımacılık" text={text} muted={textMuted} />
        </View>
      ) : categoryKind === 'horse' && (detail.horse.sire || detail.horse.dam) ? (
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: textMuted }]}>Orijin</Text>
          {detail.horse.sire ? <InfoLine label="Baba" value={detail.horse.sire} text={text} muted={textMuted} /> : null}
          {detail.horse.dam ? <InfoLine label="Anne" value={detail.horse.dam} text={text} muted={textMuted} /> : null}
          {detail.horse.damsire ? <InfoLine label="Kısrak babası" value={detail.horse.damsire} text={text} muted={textMuted} /> : null}
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

      {detail.horse.owners.length > 0 || detail.horse.trainer ? (
        <Text style={[styles.softLine, { color: textMuted }]}>
          {detail.horse.owners[0]}
          {detail.horse.owners.length > 1 ? ` +${detail.horse.owners.length - 1}` : ''}
          {detail.horse.trainer ? `  ·  ${detail.horse.trainer}` : ''}
        </Text>
      ) : null}
    </View>
  );
});

function InfoLine({
  label,
  value,
  text,
  muted,
}: {
  label: string;
  value: string;
  text: string;
  muted: string;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={[styles.infoLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

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
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    rowGap: 14,
  },
  fact: {
    width: '45%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  factCopy: { gap: 2 },
  factLabel: { fontSize: 11, fontWeight: '500' },
  factValue: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  block: { gap: 10 },
  blockLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  infoLabel: { fontSize: 13, fontWeight: '400' },
  infoValue: { fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  descBlock: { gap: 8 },
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
  softLine: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
});
