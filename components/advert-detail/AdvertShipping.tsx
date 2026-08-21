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

  const { title, highlights, trustLines } = useMemo(() => {
    if (categoryKind === 'pansiyon') {
      return {
        title: 'Tesis & Güven Standartları',
        highlights: [
          { icon: 'leaf-outline' as const, label: 'Padoklar', value: 'Geniş Çim & Kum' },
          { icon: 'medkit-outline' as const, label: 'Sağlık', value: '7/24 Veteriner Hekim' },
          { icon: 'fitness-outline' as const, label: 'İdman Pisti', value: pansiyonInfo?.trainingTrack || 'Kum İdman Pisti' },
          { icon: 'videocam-outline' as const, label: 'Güvenlik', value: '7/24 Kamera & Nöbet' },
          { icon: 'nutrition-outline' as const, label: 'Beslenme', value: 'Özel Rasyon Programı' },
          { icon: 'home-outline' as const, label: 'Doğumhane', value: 'Steril Doğum Bölümü' },
        ],
        trustLines: [
          { icon: 'shield-checkmark-outline' as const, title: 'Tesis Hijyen & Güvenlik', body: 'Düzenli dezenfeksiyon ve gece nöbetçisi gözetimi.' },
          { icon: 'eye-outline' as const, title: 'Yerinde İnceleme', body: 'Hara ve padok ziyareti randevu ile gerçekleştirilebilir.' },
          { icon: 'medkit-outline' as const, title: 'Veteriner & Aşı Takibi', body: 'Periyodik hekim muayenesi ve dijital bakım kartı tutulur.' },
        ],
      };
    }

    if (categoryKind === 'transport') {
      return {
        title: 'Taşıma Standartları & Güvenlik',
        highlights: [
          { icon: 'car-outline' as const, label: 'Zemin', value: 'Darbe Emici Kauçuk' },
          { icon: 'videocam-outline' as const, label: 'Canlı İzleme', value: 'Araç İçi Kamera' },
          { icon: 'snow-outline' as const, label: 'İklimlendirme', value: 'Otomatik Havalandırma' },
          { icon: 'shield-outline' as const, label: 'Güvence', value: 'Tam Kapsamlı Taşıma Sigortası' },
          { icon: 'navigate-outline' as const, label: 'Güzergah', value: transportInfo?.route || 'Şehirlerarası Hat' },
          { icon: 'person-outline' as const, label: 'Sürücü', value: 'Deneyimli & Lisanslı' },
        ],
        trustLines: [
          { icon: 'shield-checkmark-outline' as const, title: 'Taşıma Sigortası', body: 'Yolculuk süresince tam kapsamlı kasko ve nakliyat poliçesi.' },
          { icon: 'videocam-outline' as const, title: 'Canlı Kamera Takibi', body: 'Seyahat esnasında atınızın durumunu canlı izleme imkanı.' },
          { icon: 'water-outline' as const, title: 'Hijyen & Dezenfeksiyon', body: 'Her sefer öncesi özel solüsyonlarla araç dezenfekte edilir.' },
        ],
      };
    }

    if (categoryKind === 'farrier') {
      return {
        title: 'Nalbantlık & Hizmet Standartları',
        highlights: [
          { icon: 'hammer-outline' as const, label: 'Sıcak Nal', value: 'Ocakta Dövme & Çakım' },
          { icon: 'medkit-outline' as const, label: 'Ortopedik Nal', value: 'Açı & Terapötik Düzeltme' },
          { icon: 'navigate-outline' as const, label: 'Yerinde Servis', value: 'Haralara Mobil Ulaşım' },
          { icon: 'time-outline' as const, label: 'Randevu', value: 'Haftanın 7 Günü' },
          { icon: 'cut-outline' as const, label: 'Tırnak Bakımı', value: 'Düzeltme & Çatlak Tedavisi' },
          { icon: 'ribbon-outline' as const, label: 'Uzmanlık', value: 'Yarış & Damızlık Atları' },
        ],
        trustLines: [
          { icon: 'navigate-outline' as const, title: 'Mobil Adrese Servis', body: 'Tüm haralara tam donanımlı araç ile yerinde servis sağlanır.' },
          { icon: 'ribbon-outline' as const, title: 'Usta Nalbant Güvencesi', body: 'Ortopedik ve sportif at sağlığına uygun sertifikalı işçilik.' },
        ],
      };
    }

    if (categoryKind === 'stud') {
      return {
        title: 'Aşım Koşulları & Güvenlik',
        highlights: [
          { icon: 'ribbon-outline' as const, label: 'Irk', value: studInfo?.breed || 'Safkan' },
          { icon: 'checkmark-done-outline' as const, label: 'Garanti', value: 'Canlı Tay Garantili' },
          { icon: 'home-outline' as const, label: 'Kısrak Pansiyonu', value: 'Hara Bünyesinde Mevcut' },
          { icon: 'medkit-outline' as const, label: 'Sağlık Muayenesi', value: 'Ultrason & Veteriner Kontrol' },
          { icon: 'calendar-outline' as const, label: 'Sezon', value: '2026 Aşım Sezonu' },
          { icon: 'color-palette-outline' as const, label: 'Don', value: studInfo?.coatColor || '—' },
        ],
        trustLines: [
          { icon: 'document-text-outline' as const, title: 'Resmi Aşım Sözleşmesi', body: 'Canlı tay garantisi ve resmi aşım sertifikası düzenlenir.' },
          { icon: 'medkit-outline' as const, title: 'Aşım Öncesi Muayene', body: 'Kısrak ve aygır için kapsamlı veteriner kontrolü sağlanır.' },
          { icon: 'home-outline' as const, title: 'Kısrak Pansiyon Bakımı', body: 'Aşım süresince kısrağınız için VIP hara bakım hizmeti sunulur.' },
        ],
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
      trustLines: [
        { icon: 'medkit-outline' as const, title: 'Sağlık & aşı kaydı', body: 'Veteriner raporu ve aşı kartı talep edilebilir.' },
        { icon: 'document-text-outline' as const, title: 'Şecere ve kimlik', body: 'Soy ağacı ve kimlik belgeleri satış öncesi paylaşılır.' },
        { icon: 'eye-outline' as const, title: 'Yerinde inceleme', body: 'Deneme binişi ve hara ziyareti randevu ile.' },
      ],
    };
  }, [categoryKind, horse, pansiyonInfo, studInfo, transportInfo]);

  const yearly = horse && horse.yearly.length > 0 && horse.yearly[0].stats.starts > 0 ? horse.yearly[0] : null;

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

      <View style={styles.trust}>
        <Text style={[styles.trustTitle, { color: text }]}>
          Güvence ve İnceleme
        </Text>
        {trustLines.map((line) => (
          <TrustLine
            key={line.title}
            icon={line.icon}
            title={line.title}
            body={line.body}
            text={text}
            muted={textMuted}
            iconColor={textSecondary}
          />
        ))}
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
