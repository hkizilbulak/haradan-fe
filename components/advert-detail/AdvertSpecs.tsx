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
import { locationLookup } from '@/services/location';
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

  const locationCity = useMemo(() => {
    if (!detail) return '';
    const prov = detail.provinceId
      ? locationLookup.getProvinceName(detail.provinceId) || detail.provinceId
      : '';
    const dist = detail.districtId
      ? locationLookup.getDistrictName(detail.districtId) || detail.districtId
      : '';
    return [dist, prov].filter(Boolean).join(', ') || 'Belirtilmedi';
  }, [detail]);

  const { title, row1, row2, hasRaces } = useMemo(() => {
    if (categoryKind === 'pansiyon') {
      const s1: SoftSection = {
        id: 'pansiyon-facilities',
        title: 'Tesis ve Padoklar',
        rows: [
          {
            icon: 'leaf-outline',
            label: 'Çim Padok',
            value: pansiyonInfo?.hasGrassPaddock ? 'Mevcut' : 'Yok',
          },
          {
            icon: 'grid-outline',
            label: 'Kum Padok',
            value: pansiyonInfo?.hasSandPaddock ? 'Mevcut' : 'Yok',
          },
          {
            icon: 'shield-outline',
            label: 'Aygır Padoğu',
            value: pansiyonInfo?.hasStallionPaddock ? 'Mevcut' : 'Yok',
          },
          {
            icon: 'fitness-outline',
            label: 'İdman Pisti',
            value: pansiyonInfo?.trainingTrack || 'Mevcut Değil',
          },
        ],
      };
      const s2: SoftSection = {
        id: 'pansiyon-health',
        title: 'Sağlık ve Bakım Olanakları',
        rows: [
          {
            icon: 'medkit-outline',
            label: 'Veteriner Hekim',
            value: pansiyonInfo?.hasVeterinarian ? 'Mevcut' : 'Yok',
          },
          {
            icon: 'hammer-outline',
            label: 'Nalbant Hizmeti',
            value: pansiyonInfo?.hasFarrier ? 'Mevcut' : 'Yok',
          },
          {
            icon: 'home-outline',
            label: 'Doğumhane',
            value: pansiyonInfo?.hasFoalingBarn ? 'Mevcut' : 'Yok',
          },
        ],
      };
      const s3: SoftSection = {
        id: 'pansiyon-location',
        title: 'Konum ve Adres',
        rows: [
          { icon: 'location-outline', label: 'Şehir / İlçe', value: locationCity },
          ...(detail?.address
            ? [{ icon: 'navigate-outline' as const, label: 'Açık Adres', value: detail.address }]
            : []),
        ],
      };
      return { title: 'Tesis ve Hizmet Detayları', row1: [s1, s2, s3], row2: [], hasRaces: false };
    }

    if (categoryKind === 'transport') {
      const s1: SoftSection = {
        id: 'transport-info',
        title: 'Firma ve Hizmet Bilgileri',
        rows: [
          {
            icon: 'business-outline',
            label: 'Firma Adı',
            value: transportInfo?.companyName || detail?.title || 'Belirtilmedi',
          },
          ...(transportInfo?.websiteUrl
            ? [{ icon: 'globe-outline' as const, label: 'Web Sitesi', value: transportInfo.websiteUrl }]
            : []),
          {
            icon: 'car-outline',
            label: 'Hizmet Alanı',
            value: 'At Nakliyesi ve Taşımacılık',
          },
        ],
      };
      const s2: SoftSection = {
        id: 'transport-location',
        title: 'Konum ve Bölge',
        rows: [
          { icon: 'location-outline', label: 'Şehir / İlçe', value: locationCity },
          ...(detail?.address
            ? [{ icon: 'navigate-outline' as const, label: 'Açık Adres', value: detail.address }]
            : []),
        ],
      };
      return { title: 'Nakliye ve Firma Detayları', row1: [s1, s2], row2: [], hasRaces: false };
    }

    if (categoryKind === 'farrier') {
      const s1: SoftSection = {
        id: 'farrier-info',
        title: 'Hizmet Bilgileri',
        rows: [
          {
            icon: 'hammer-outline',
            label: 'Hizmet Türü',
            value: 'Nalbantlık ve Tırnak Bakımı',
          },
          {
            icon: 'checkmark-circle-outline',
            label: 'Hizmet Şekli',
            value: 'Randevulu / Harada Servis',
          },
        ],
      };
      const s2: SoftSection = {
        id: 'farrier-location',
        title: 'Konum ve Bölge',
        rows: [
          { icon: 'location-outline', label: 'Şehir / İlçe', value: locationCity },
          ...(detail?.address
            ? [{ icon: 'navigate-outline' as const, label: 'Açık Adres', value: detail.address }]
            : []),
        ],
      };
      return { title: 'Nalbantlık Hizmet Detayları', row1: [s1, s2], row2: [], hasRaces: false };
    }

    if (categoryKind === 'stud') {
      const s1: SoftSection = {
        id: 'stud-identity',
        title: 'At / Aygır Bilgileri',
        rows: [
          {
            icon: 'ribbon-outline',
            label: 'Aygır Adı',
            value: studInfo?.name || detail?.title || 'Aygır',
          },
          {
            icon: 'leaf-outline',
            label: 'At Irkı',
            value: studInfo?.breed || 'Belirtilmedi',
          },
          {
            icon: 'calendar-outline',
            label: 'Yaş',
            value: studInfo?.age
              ? studInfo.age.includes('ya') || studInfo.age.includes('Ya')
                ? studInfo.age
                : `${studInfo.age} Yaş`
              : 'Belirtilmedi',
          },
          {
            icon: 'color-palette-outline',
            label: 'Donu (Renk)',
            value: studInfo?.coatColor || 'Belirtilmedi',
          },
        ],
      };
      const s2: SoftSection = {
        id: 'stud-pedigree',
        title: 'Soy Kütüğü (Pedigree)',
        rows: [
          { icon: 'git-branch-outline', label: 'Baba (Sire)', value: studInfo?.sire || 'Belirtilmedi' },
          { icon: 'git-branch-outline', label: 'Anne (Dam)', value: studInfo?.dam || 'Belirtilmedi' },
          { icon: 'git-network-outline', label: 'Annesinin Babası (Damsire)', value: studInfo?.damsire || 'Belirtilmedi' },
        ],
      };
      const s3: SoftSection = {
        id: 'stud-location',
        title: 'Konum ve Adres',
        rows: [
          { icon: 'location-outline', label: 'Şehir / İlçe', value: locationCity },
          ...(detail?.address
            ? [{ icon: 'navigate-outline' as const, label: 'Açık Adres', value: detail.address }]
            : []),
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
    if (locationCity && locationCity !== 'Belirtilmedi') people.push({ icon: 'location-outline', label: 'Konum', value: locationCity });

    const r1: SoftSection[] = [];
    if (identity.length > 0) r1.push({ id: 'identity', title: 'Kimlik ve fiziksel', rows: identity });
    if (pedigree.length > 0) r1.push({ id: 'pedigree', title: 'Orijin (soy ağacı)', rows: pedigree });
    if (people.length > 0) r1.push({ id: 'people', title: 'İlgili kişiler ve konum', rows: people });

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
  }, [categoryKind, detail, horse, locationCity, pansiyonInfo, studInfo, transportInfo]);

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
