import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatMoney } from '@/utils/formatMoney';
import type { HorseProfile } from '@/types';

type AdvertShippingProps = {
  horse: HorseProfile;
};

type Highlight = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

/**
 * Görsel yanı alt panel — genel bilgilerden en kritik özet +
 * at alımına uygun güven sinyalleri (nakliye / ödeme yerine).
 */
export const AdvertShipping = memo(function AdvertShipping({
  horse,
}: AdvertShippingProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');

  const highlights: Highlight[] = [
    {
      icon: 'leaf-outline',
      label: 'Cins',
      value: horse.breed,
    },
    {
      icon: 'resize-outline',
      label: 'Cidago',
      value: horse.heightCm ? `${horse.heightCm} cm` : '—',
    },
    {
      icon: 'trophy-outline',
      label: 'Kariyer',
      value: `${horse.career.starts} start · ${horse.career.first}-${horse.career.second}-${horse.career.third}`,
    },
    {
      icon: 'speedometer-outline',
      label: 'Handikap',
      value: String(horse.handicap),
    },
    {
      icon: 'git-branch-outline',
      label: 'Baba',
      value: horse.sire,
    },
    {
      icon: 'home-outline',
      label: 'Yetiştirici',
      value: horse.breeder,
    },
  ];

  const yearly = horse.yearly[0];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: text }]}>Öne çıkan bilgiler</Text>

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

      <View style={styles.trust}>
        <Text style={[styles.trustTitle, { color: text }]}>
          İnceleme ve belgeler
        </Text>
        <TrustLine
          icon="medkit-outline"
          title="Sağlık & aşı kaydı"
          body="Veteriner raporu ve aşı kartı talep edilebilir."
          text={text}
          muted={textMuted}
          iconColor={textSecondary}
        />
        <TrustLine
          icon="document-text-outline"
          title="Şecere ve kimlik"
          body="Soy ağacı ve kimlik belgeleri satış öncesi paylaşılır."
          text={text}
          muted={textMuted}
          iconColor={textSecondary}
        />
        <TrustLine
          icon="eye-outline"
          title="Yerinde inceleme"
          body="Deneme binisi ve hara ziyareti randevu ile."
          text={text}
          muted={textMuted}
          iconColor={textSecondary}
        />
      </View>
    </View>
  );
});

function TrustLine({
  icon,
  title,
  body,
  text,
  muted,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  text: string;
  muted: string;
  iconColor: string;
}) {
  return (
    <View style={styles.trustRow}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <View style={styles.trustCopy}>
        <Text style={[styles.trustItemTitle, { color: text }]}>{title}</Text>
        <Text style={[styles.trustBody, { color: muted }]}>{body}</Text>
      </View>
    </View>
  );
}

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
  trust: { gap: 14, marginTop: 4 },
  trustTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  trustCopy: { flex: 1, gap: 2, minWidth: 0 },
  trustItemTitle: { fontSize: 13, fontWeight: '600' },
  trustBody: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
});
