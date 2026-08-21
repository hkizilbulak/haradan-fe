import React, { memo, useMemo } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertDetail, AdvertSpecGroup, HorseProfile } from '@/types';
import {
  getAdvertCategoryKind,
  parsePansiyonInfo,
  parseStudInfo,
  parseTransportInfo,
} from './advertCategoryHelper';

type AdvertSpecsProps = {
  groups: AdvertSpecGroup[];
  horse?: HorseProfile;
  detail?: AdvertDetail;
};

type SoftRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
};

type SoftSection = {
  id: string;
  title: string;
  rows: SoftRow[];
};

/** Genel bilgiler — her zaman açık, 3 kolon. */
export const AdvertSpecs = memo(function AdvertSpecs({
  groups,
  horse: propHorse,
  detail,
}: AdvertSpecsProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');

  const categoryKind = detail ? getAdvertCategoryKind(detail) : 'horse';
  const horse = detail?.horse ?? propHorse;
  const studInfo = useMemo(() => (detail ? parseStudInfo(detail) : null), [detail]);
  const pansiyonInfo = useMemo(() => (detail ? parsePansiyonInfo(detail) : null), [detail]);
  const transportInfo = useMemo(() => (detail ? parseTransportInfo(detail) : null), [detail]);

  const { title, row1, row2, hasRaces } = useMemo(() => {
    if (categoryKind === 'pansiyon') {
      const s1: SoftSection = {
        id: 'pansiyon-facilities',
        title: 'Tesis ve Padok Özellikleri',
        rows: [
          { icon: 'leaf-outline', label: 'Çim Padok', value: 'Geniş Çim Otlatma Padokları' },
          { icon: 'grid-outline', label: 'Kum Padok', value: 'Drenajlı Kum Dinlenme Alanı' },
          { icon: 'shield-outline', label: 'Aygır Padoğu', value: 'Yüksek Çitli Özel Güvenli Alan' },
          { icon: 'fitness-outline', label: 'İdman Pisti', value: pansiyonInfo?.trainingTrack || 'Kum İdman Pisti' },
        ],
      };
      const s2: SoftSection = {
        id: 'pansiyon-health',
        title: 'Sağlık ve Bakım Hizmetleri',
        rows: [
          { icon: 'medkit-outline', label: 'Veteriner Hekim', value: '7/24 Düzenli Kontrol & Müdahale' },
          { icon: 'home-outline', label: 'Doğumhane', value: 'Kamera Takipli Steril Doğum Locası' },
          { icon: 'hammer-outline', label: 'Nalbant Hizmeti', value: 'Periyodik Tırnak ve Nal Bakımı' },
          { icon: 'nutrition-outline', label: 'Özel Beslenme', value: 'Kaliteli Yem & Rasyon Programı' },
        ],
      };
      const s3: SoftSection = {
        id: 'pansiyon-security',
        title: 'Güvenlik ve Hara Yönetimi',
        rows: [
          { icon: 'videocam-outline', label: 'Kamera Sistemi', value: '7/24 Gece Görüşlü Güvenlik Kamerası' },
          { icon: 'person-outline', label: 'Gece Nöbetçisi', value: 'Kesintisiz 24 Saat Personel Nöbeti' },
          { icon: 'calendar-outline', label: 'Ziyaret Saatleri', value: 'Haftanın 7 Günü Randevulu Ziyaret' },
        ],
      };
      return { title: 'Tesis ve Hizmet Detayları', row1: [s1, s2, s3], row2: [], hasRaces: false };
    }

    if (categoryKind === 'transport') {
      const s1: SoftSection = {
        id: 'transport-vehicle',
        title: 'Araç ve Donanım',
        rows: [
          { icon: 'car-outline', label: 'Zemin', value: 'Darbe Emici Yumuşak Kauçuk Taban' },
          { icon: 'snow-outline', label: 'Havalandırma', value: 'Otomatik Termostatlı İklimlendirme' },
          { icon: 'flash-outline', label: 'Süspansiyon', value: 'Havalı & Sarsıntısız Süspansiyon' },
          { icon: 'videocam-outline', label: 'İç Kamera', value: 'Yol Boyu Canlı HD Kamera Takibi' },
        ],
      };
      const s2: SoftSection = {
        id: 'transport-routes',
        title: 'Güzergah ve Seferler',
        rows: [
          { icon: 'navigate-outline', label: 'Hatlar', value: transportInfo?.route || 'Şehirlerarası Düzenli Seferler' },
          { icon: 'trophy-outline', label: 'Hipodrom', value: 'İstanbul, İzmir, Adana, Bursa, Ankara' },
          { icon: 'calendar-outline', label: 'Sefer Şekli', value: 'Haftalık Ring & Özel VIP Sevkıyat' },
        ],
      };
      const s3: SoftSection = {
        id: 'transport-insurance',
        title: 'Güvenlik ve Sigorta',
        rows: [
          { icon: 'shield-checkmark-outline', label: 'Taşıma Sigortası', value: 'Tam Kapsamlı Nakliyat Kaskosu' },
          { icon: 'person-outline', label: 'Sürücüler', value: 'Lisanslı & Deneyimli At Seyisi / Şoför' },
          { icon: 'water-outline', label: 'Dezenfeksiyon', value: 'Her Sefer Öncesi & Sonrası Temizlik' },
        ],
      };
      return { title: 'Nakliye ve Taşıma Detayları', row1: [s1, s2, s3], row2: [], hasRaces: false };
    }

    if (categoryKind === 'farrier') {
      const s1: SoftSection = {
        id: 'farrier-techniques',
        title: 'Nallama Uygulamaları',
        rows: [
          { icon: 'hammer-outline', label: 'Sıcak Nal Çakımı', value: 'Ocakta Tırnağa Birebir Dövme' },
          { icon: 'checkmark-circle-outline', label: 'Soğuk Nal', value: 'Standart ve Hızlı Uygulama' },
          { icon: 'trophy-outline', label: 'Yarış Nalları', value: 'Hafif Alüminyum & Çelik Nallar' },
        ],
      };
      const s2: SoftSection = {
        id: 'farrier-health',
        title: 'Ortopedik ve Terapötik Bakım',
        rows: [
          { icon: 'medkit-outline', label: 'Açı Dengeleme', value: 'Basış ve Açı Düzeltme İşlemleri' },
          { icon: 'cut-outline', label: 'Çatlak Tedavisi', value: 'Özel Reçine & Klips Uygulaması' },
          { icon: 'layers-outline', label: 'Taban Desteği', value: 'Silikon ve Terapötik Tabanlık' },
        ],
      };
      const s3: SoftSection = {
        id: 'farrier-service',
        title: 'Hizmet ve Randevu',
        rows: [
          { icon: 'navigate-outline', label: 'Mobil Hizmet', value: 'Haralara Tam Donanımlı Mobil Servis' },
          { icon: 'calendar-outline', label: 'Çalışma Günleri', value: 'Haftanın 7 Günü Hizmet' },
        ],
      };
      return { title: 'Nalbantlık Hizmet Detayları', row1: [s1, s2, s3], row2: [], hasRaces: false };
    }

    if (categoryKind === 'stud') {
      const s1: SoftSection = {
        id: 'stud-identity',
        title: 'Aygır Kimlik Bilgileri',
        rows: [
          { icon: 'ribbon-outline', label: 'Aygır Adı', value: studInfo?.name || detail?.title || 'Aygır' },
          { icon: 'leaf-outline', label: 'At Irkı', value: studInfo?.breed || 'Safkan' },
          { icon: 'calendar-outline', label: 'Yaş', value: studInfo?.age || '—' },
          { icon: 'color-palette-outline', label: 'Don', value: studInfo?.coatColor || '—' },
        ],
      };
      const s2: SoftSection = {
        id: 'stud-pedigree',
        title: 'Soy Kütüğü (Pedigree)',
        rows: [
          { icon: 'git-branch-outline', label: 'Baba (Sire)', value: studInfo?.sire || '—' },
          { icon: 'git-branch-outline', label: 'Anne (Dam)', value: studInfo?.dam || '—' },
          { icon: 'git-network-outline', label: 'Annesinin Babası', value: studInfo?.damsire || '—' },
        ],
      };
      const s3: SoftSection = {
        id: 'stud-conditions',
        title: 'Aşım Koşulları ve Tesis',
        rows: [
          { icon: 'checkmark-done-outline', label: 'Garanti', value: 'Canlı Tay Garantisi' },
          { icon: 'home-outline', label: 'Kısrak Pansiyonu', value: 'Hara Bünyesinde Bakım Mevcut' },
          { icon: 'medkit-outline', label: 'Veteriner Muayenesi', value: 'Tam Kapsamlı Ultrason ve Kontrol' },
        ],
      };
      return { title: 'Aygır ve Aşım Detayları', row1: [s1, s2, s3], row2: [], hasRaces: false };
    }

    // Default Horse Listing
    const identity: SoftRow[] = [];
    if (horse?.registeredName) identity.push({ icon: 'ribbon-outline', label: 'İsim', value: horse.registeredName });
    if (horse && horse.age > 0) identity.push({ icon: 'calendar-outline', label: 'Yaş / doğum', value: `${horse.age} yaş`, hint: horse.birthDate });
    if (horse?.gender) identity.push({ icon: 'male-female-outline', label: 'Cinsiyet', value: horse.gender });
    if (horse?.coatColor) identity.push({ icon: 'color-palette-outline', label: 'Don', value: horse.coatColor });
    if (horse?.breed) identity.push({ icon: 'leaf-outline', label: 'Cins', value: horse.breed });
    if (horse?.heightCm) identity.push({ icon: 'resize-outline' as const, label: 'Cidago', value: `${horse.heightCm} cm` });

    const pedigree: SoftRow[] = [];
    if (horse?.sire) pedigree.push({ icon: 'git-branch-outline', label: 'Baba', value: horse.sire });
    if (horse?.dam) pedigree.push({ icon: 'git-branch-outline', label: 'Anne', value: horse.dam });
    if (horse?.damsire) pedigree.push({ icon: 'git-network-outline', label: 'Kısrak babası', value: horse.damsire });

    const people: SoftRow[] = [];
    if (horse && horse.owners.length > 0) people.push({ icon: 'person-outline', label: 'Sahip', value: horse.owners.join(', ') });
    if (horse?.breeder) people.push({ icon: 'home-outline', label: 'Yetiştirici', value: horse.breeder });
    if (horse?.trainer) people.push({ icon: 'fitness-outline', label: 'Antrenör', value: horse.trainer });

    const r1: SoftSection[] = [];
    if (identity.length > 0) r1.push({ id: 'identity', title: 'Kimlik ve fiziksel', rows: identity });
    if (pedigree.length > 0) r1.push({ id: 'pedigree', title: 'Orijin (soy ağacı)', rows: pedigree });
    if (people.length > 0) r1.push({ id: 'people', title: 'İlgili kişiler', rows: people });

    const r2: SoftSection[] = [];
    if (horse && horse.career.starts > 0) {
      r2.push({
        id: 'performance',
        title: 'Performans ve kazanç',
        rows: [
          { icon: 'trophy-outline', label: 'Kariyer', value: `${horse.career.starts} start · ${horse.career.first}-${horse.career.second}-${horse.career.third}` },
          { icon: 'speedometer-outline', label: 'Handikap', value: String(horse.handicap) },
        ],
      });
    }

    return {
      title: 'Genel bilgiler',
      row1: r1,
      row2: r2,
      hasRaces: Boolean(horse && horse.races.length > 0),
    };
  }, [categoryKind, detail, horse, pansiyonInfo, studInfo, transportInfo]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.pageTitle, { color: text }]}>{title}</Text>

      {row1.length > 0 ? (
        <View style={[styles.columns, !isWide && styles.columnsStack]}>
          {row1.map((section) => (
            <SpecColumn
              key={section.id}
              section={section}
              text={text}
              textMuted={textMuted}
              textSecondary={textSecondary}
              stack={!isWide}
            />
          ))}
        </View>
      ) : null}

      {row2.length > 0 ? (
        <View style={[styles.columns, !isWide && styles.columnsStack]}>
          {row2.map((section) => (
            <SpecColumn
              key={section.id}
              section={section}
              text={text}
              textMuted={textMuted}
              textSecondary={textSecondary}
              stack={!isWide}
            />
          ))}
        </View>
      ) : null}

      {hasRaces && horse ? (
        <View style={[styles.columns, !isWide && styles.columnsStack]}>
          <View style={[styles.column, !isWide && styles.columnStack]}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              Yarış geçmişi
            </Text>
            <View style={styles.raceList}>
              {horse.races.slice(0, 5).map((race) => (
                <View key={race.id} style={styles.raceRow}>
                  <Text style={[styles.racePlace, { color: header }]}>
                    {race.place}.
                  </Text>
                  <View style={styles.raceCopy}>
                    <Text
                      style={[styles.raceVenue, { color: text }]}
                      numberOfLines={1}
                    >
                      {race.venue}
                    </Text>
                    <Text style={[styles.raceMeta, { color: textMuted }]}>
                      {race.date} · {race.distance} · {race.surface}
                    </Text>
                  </View>
                  {race.videoUrl ? (
                    <Pressable
                      onPress={() => Linking.openURL(race.videoUrl!)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={20}
                        color={header}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
});

function SpecColumn({
  section,
  text,
  textMuted,
  textSecondary,
  stack,
}: {
  section: SoftSection;
  text: string;
  textMuted: string;
  textSecondary: string;
  stack: boolean;
}) {
  return (
    <View style={[styles.column, stack && styles.columnStack]}>
      <Text style={[styles.sectionTitle, { color: text }]}>
        {section.title}
      </Text>
      <View style={styles.rows}>
        {section.rows.map((row) => (
          <View key={`${section.id}-${row.label}`} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={row.icon} size={15} color={textSecondary} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowLabel, { color: textMuted }]}>
                {row.label}
              </Text>
              <Text style={[styles.rowValue, { color: text }]} numberOfLines={2}>
                {row.value}
              </Text>
              {row.hint ? (
                <Text style={[styles.rowHint, { color: textMuted }]}>
                  {row.hint}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xl },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
  },
  columnsStack: {
    flexDirection: 'column',
    gap: 22,
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  columnStack: {
    flex: undefined,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  rows: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rowCopy: { flex: 1, gap: 2, minWidth: 0 },
  rowLabel: { fontSize: 11, fontWeight: '500' },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.15,
    lineHeight: 18,
  },
  rowHint: { fontSize: 11, fontWeight: '400', marginTop: 1 },
  raceList: { gap: 12 },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  racePlace: {
    fontSize: 14,
    fontWeight: '700',
    width: 22,
  },
  raceCopy: { flex: 1, gap: 2, minWidth: 0 },
  raceVenue: { fontSize: 13, fontWeight: '600' },
  raceMeta: { fontSize: 11, lineHeight: 15 },
});
