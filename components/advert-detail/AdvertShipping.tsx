import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import type { AdvertDetail, HorseProfile } from '@/types';
import {
  getAdvertCategoryKind,
  parsePansiyonInfo,
  parseStudInfo,
  parseTransportInfo,
} from './advertCategoryHelper';

type AdvertShippingProps = {
  horse?: HorseProfile;
  detail?: AdvertDetail;
};

type Highlight = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

/**
 * Görsel yanı alt panel — genel bilgilerden en kritik özet +
 * kategoriye uygun güven sinyalleri.
 */
export const AdvertShipping = memo(function AdvertShipping({
  horse: propHorse,
  detail,
}: AdvertShippingProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');

  const categoryKind = detail ? getAdvertCategoryKind(detail) : 'horse';
  const horse = detail?.horse ?? propHorse;
  const studInfo = useMemo(() => (detail ? parseStudInfo(detail) : null), [detail]);
  const pansiyonInfo = useMemo(() => (detail ? parsePansiyonInfo(detail) : null), [detail]);
  const transportInfo = useMemo(() => (detail ? parseTransportInfo(detail) : null), [detail]);

  const { title, highlights } = useMemo(() => {
    if (categoryKind === 'pansiyon') {
      const hl: Highlight[] = [];
      if (pansiyonInfo?.hasGrassPaddock) hl.push({ icon: 'leaf-outline', label: 'Tesis', value: 'Çim Padok' });
      if (pansiyonInfo?.hasSandPaddock) hl.push({ icon: 'grid-outline', label: 'Tesis', value: 'Kum Padok' });
      if (pansiyonInfo?.hasStallionPaddock) hl.push({ icon: 'shield-outline', label: 'Tesis', value: 'Aygır Padoğu' });
      if (pansiyonInfo?.hasVeterinarian) hl.push({ icon: 'medkit-outline', label: 'Sağlık', value: 'Veteriner Hekim' });
      if (pansiyonInfo?.hasFarrier) hl.push({ icon: 'hammer-outline', label: 'Bakım', value: 'Nalbant' });
      if (pansiyonInfo?.hasFoalingBarn) hl.push({ icon: 'home-outline', label: 'Tesis', value: 'Doğumhane' });
      if (pansiyonInfo?.hasTrainingTrack || pansiyonInfo?.trainingTrack) hl.push({ icon: 'fitness-outline', label: 'İdman', value: 'İdman Pisti' });

      return {
        title: 'Tesis & Güven Standartları',
        highlights: hl,
      };
    }

    if (categoryKind === 'transport') {
      const hl: Highlight[] = [];
      if (transportInfo?.companyName) hl.push({ icon: 'business-outline', label: 'Firma', value: transportInfo.companyName });
      if (transportInfo?.websiteUrl) hl.push({ icon: 'globe-outline', label: 'Web', value: transportInfo.websiteUrl });

      return {
        title: 'Firma & Hizmet Bilgisi',
        highlights: hl,
      };
    }

    if (categoryKind === 'farrier') {
      return {
        title: 'Hizmet & Güvenlik',
        highlights: [],
      };
    }

    if (categoryKind === 'stud') {
      const hl: Highlight[] = [];
      if (studInfo?.breed) hl.push({ icon: 'ribbon-outline', label: 'Irk', value: studInfo.breed });
      if (studInfo?.age) hl.push({ icon: 'calendar-outline', label: 'Yaş', value: studInfo.age });
      if (studInfo?.coatColor) hl.push({ icon: 'color-palette-outline', label: 'Don', value: studInfo.coatColor });
      if (studInfo?.sire) hl.push({ icon: 'git-branch-outline', label: 'Baba', value: studInfo.sire });

      return {
        title: 'Aşım & Bilgi Standartları',
        highlights: hl,
      };
    }

    // Default horse listing
    const hl: Highlight[] = [];
    if (horse?.breed) hl.push({ icon: 'leaf-outline', label: 'Cins', value: horse.breed });
    if (horse?.heightCm) hl.push({ icon: 'resize-outline', label: 'Cidago', value: `${horse.heightCm} cm` });
    if (horse && horse.career.starts > 0) {
      hl.push({ icon: 'trophy-outline', label: 'Kariyer', value: `${horse.career.starts} start · ${horse.career.first}-${horse.career.second}-${horse.career.third}` });
    }
    if (horse && horse.handicap > 0) {
      hl.push({ icon: 'speedometer-outline', label: 'Handikap', value: String(horse.handicap) });
    }
    if (horse?.sire) hl.push({ icon: 'git-branch-outline', label: 'Baba', value: horse.sire });
    if (horse?.breeder) hl.push({ icon: 'home-outline', label: 'Yetiştirici', value: horse.breeder });

    return {
      title: 'Öne çıkan bilgiler',
      highlights: hl,
    };
  }, [categoryKind, horse, pansiyonInfo, studInfo, transportInfo]);

  const yearly = horse && horse.yearly.length > 0 && horse.yearly[0].stats.starts > 0 ? horse.yearly[0] : null;

  if (highlights.length === 0 && !yearly) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: text }]}>{title}</Text>

      {highlights.length > 0 ? (
        <View style={styles.grid}>
          {highlights.map((h) => (
            <View key={h.label} style={styles.cell}>
              <Ionicons name={h.icon} size={15} color={textSecondary} />
              <View style={styles.cellCopy}>
                <Text style={[styles.cellLabel, { color: textMuted }]}>
                  {h.label}
                </Text>
                <Text
                  style={[styles.cellValue, { color: text }]}
                  numberOfLines={1}
                >
                  {h.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {yearly ? (
        <View style={styles.season}>
          <Text style={[styles.seasonLabel, { color: textMuted }]}>
            {yearly.year} sezonu
          </Text>
          <Text style={[styles.seasonValue, { color: text }]}>
            {yearly.stats.starts} start · {yearly.stats.first}-
            {yearly.stats.second}-{yearly.stats.third} ·{' '}
            {formatMoney(yearly.earnings)}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 16, marginTop: Spacing.lg },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    rowGap: 14,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cellCopy: { flex: 1, gap: 2, minWidth: 0 },
  cellLabel: { fontSize: 11, fontWeight: '500' },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  season: { gap: 4 },
  seasonLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  seasonValue: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
});
