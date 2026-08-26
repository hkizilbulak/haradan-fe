import React, { memo, useMemo } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertDetail, AdvertSpecGroup, HorseProfile } from '@/types';
import { useAdvertLocation } from '@/services/location';

type AdvertSpecsProps = {
  groups: AdvertSpecGroup[];
  horse?: HorseProfile;
  detail?: AdvertDetail;
};

type SoftRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  badge?: string;
  badgeTone?: 'primary' | 'muted' | 'success';
  onPress?: () => void;
  hint?: string;
};

type SoftSection = {
  id: string;
  title: string;
  rows: SoftRow[];
};

function getSpecIcon(label: string): keyof typeof Ionicons.glyphMap {
  const l = (label || '').toLowerCase();
  if (l.includes('padok') || l.includes('paddock') || l.includes('çim') || l.includes('kum')) return 'leaf-outline';
  if (l.includes('vet') || l.includes('sağlık') || l.includes('hekim')) return 'medkit-outline';
  if (l.includes('nalbant') || l.includes('farrier') || l.includes('bakım')) return 'hammer-outline';
  if (l.includes('doğum') || l.includes('barn') || l.includes('ahır') || l.includes('haras')) return 'home-outline';
  if (l.includes('pist') || l.includes('track') || l.includes('idman') || l.includes('antren')) return 'fitness-outline';
  if (l.includes('firma') || l.includes('şirket') || l.includes('company')) return 'business-outline';
  if (l.includes('web') || l.includes('site') || l.includes('url')) return 'globe-outline';
  if (l.includes('telefon') || l.includes('phone') || l.includes('iletişim')) return 'call-outline';
  if (l.includes('konum') || l.includes('şehir') || l.includes('ilçe') || l.includes('adres')) return 'location-outline';
  if (l.includes('aygır') || l.includes('at adı') || l.includes('isim') || l.includes('ad')) return 'ribbon-outline';
  if (l.includes('Irk') || l.includes('breed') || l.includes('cins')) return 'leaf-outline';
  if (l.includes('yaş') || l.includes('age') || l.includes('tarih') || l.includes('doğum') || l.includes('yıl')) return 'calendar-outline';
  if (l.includes('don') || l.includes('renk') || l.includes('coat') || l.includes('color')) return 'color-palette-outline';
  if (l.includes('cinsiyet') || l.includes('gender')) return 'male-female-outline';
  if (l.includes('baba') || l.includes('sire') || l.includes('anne') || l.includes('dam') || l.includes('pedigree') || l.includes('soyağac') || l.includes('orijin')) return 'git-branch-outline';
  if (l.includes('kısrak babası') || l.includes('damsire')) return 'git-network-outline';
  if (l.includes('sahip') || l.includes('kişi') || l.includes('person') || l.includes('yetiştirici')) return 'person-outline';
  if (l.includes('kamera') || l.includes('video') || l.includes('güvenlik')) return 'videocam-outline';
  if (l.includes('garanti') || l.includes('belge') || l.includes('aşım')) return 'shield-checkmark-outline';
  if (l.includes('cidago') || l.includes('boy') || l.includes('ölçü')) return 'resize-outline';
  if (l.includes('fiyat') || l.includes('ücret') || l.includes('ödeme')) return 'pricetag-outline';
  return 'information-circle-outline';
}

/** Genel bilgiler — dinamik resolved properties, TJK soy kütüğü ve konum detayları. */
export const AdvertSpecs = memo(function AdvertSpecs({
  groups,
  horse: propHorse,
  detail,
}: AdvertSpecsProps) {
  const isWide = useIsWideLayout();

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');

  const horse = detail?.horse ?? propHorse;
  const rawLocation = useAdvertLocation(detail);
  const locationCity = rawLocation || 'Belirtilmedi';

  const { title, row1, row2, hasRaces } = useMemo(() => {
    const sections: SoftSection[] = [];

    // 1. TJK Horse Identity & Pedigree (if meaningful horse info is present)
    const hasHorseData = Boolean(
      horse && (
        (horse.registeredName && horse.registeredName !== 'Başlıksız ilan' && horse.registeredName.trim() !== '') ||
        horse.sire ||
        horse.dam ||
        horse.damsire ||
        (horse.age != null && horse.age > 0) ||
        horse.gender ||
        horse.coatColor ||
        horse.breed ||
        (horse.career && horse.career.starts > 0) ||
        (horse.races && horse.races.length > 0)
      )
    );

    if (hasHorseData && horse) {
      const identity: SoftRow[] = [];
      const horseName = horse.registeredName || detail?.title || '';
      if (horseName) identity.push({ icon: 'ribbon-outline', label: 'İsim', value: horseName });
      if (horse.age != null && horse.age > 0) {
        identity.push({
          icon: 'calendar-outline',
          label: 'Yaş / Doğum',
          value: `${horse.age} yaş`,
          hint: horse.birthDate || undefined,
        });
      } else if (horse.birthDate) {
        identity.push({
          icon: 'calendar-outline',
          label: 'Doğum Tarihi',
          value: horse.birthDate,
        });
      }
      if (horse.gender) identity.push({ icon: 'male-female-outline', label: 'Cinsiyet', value: horse.gender });
      if (horse.coatColor) identity.push({ icon: 'color-palette-outline', label: 'Don', value: horse.coatColor });
      if (horse.breed) identity.push({ icon: 'leaf-outline', label: 'Cins / Irk', value: horse.breed });
      if (horse.heightCm) identity.push({ icon: 'resize-outline', label: 'Cidago', value: `${horse.heightCm} cm` });

      if (identity.length > 0) {
        sections.push({ id: 'horse-identity', title: 'Kimlik ve Fiziksel', rows: identity });
      }

      const pedigree: SoftRow[] = [];
      if (horse.sire) pedigree.push({ icon: 'git-branch-outline', label: 'Baba', value: horse.sire });
      if (horse.dam) pedigree.push({ icon: 'git-branch-outline', label: 'Anne', value: horse.dam });
      if (horse.damsire) pedigree.push({ icon: 'git-network-outline', label: 'Kısrak Babası', value: horse.damsire });

      if (pedigree.length > 0) {
        sections.push({ id: 'horse-pedigree', title: 'Orijin (Soy Ağacı)', rows: pedigree });
      }

      const people: SoftRow[] = [];
      if (horse.owners && horse.owners.length > 0) people.push({ icon: 'person-outline', label: 'Sahip', value: horse.owners.join(', ') });
      if (horse.breeder) people.push({ icon: 'home-outline', label: 'Yetiştirici', value: horse.breeder });
      if (horse.trainer) people.push({ icon: 'fitness-outline', label: 'Antrenör', value: horse.trainer });

      if (people.length > 0) {
        sections.push({ id: 'horse-people', title: 'İlgili Kişiler', rows: people });
      }
    }

    // 2. Dynamic Resolved Category Properties (from groups or detail.specs)
    const allGroups = groups && groups.length > 0 ? groups : (detail?.specs ?? []);
    for (const g of allGroups) {
      if (g && g.rows && g.rows.length > 0) {
        const validRows: SoftRow[] = g.rows
          .filter((r) => r.label && r.value != null && String(r.value).trim() !== '' && String(r.value) !== 'null' && String(r.value) !== 'undefined')
          .map((r) => ({
            icon: getSpecIcon(r.label),
            label: r.label,
            value: String(r.value),
            hint: r.hint,
          }));
        if (validRows.length > 0) {
          if (validRows.length > 5) {
            const chunk1 = validRows.slice(0, Math.ceil(validRows.length / 2));
            const chunk2 = validRows.slice(Math.ceil(validRows.length / 2));
            sections.push({ id: `${g.id || 'props'}-1`, title: g.title || 'Özellikler', rows: chunk1 });
            sections.push({ id: `${g.id || 'props'}-2`, title: 'Ek Özellikler', rows: chunk2 });
          } else {
            sections.push({ id: g.id || 'category-specs', title: g.title || 'Özellikler', rows: validRows });
          }
        }
      }
    }

    // 3. Location and Address (Core Advert Data)
    const locationRows: SoftRow[] = [];
    if (locationCity && locationCity !== 'Belirtilmedi') {
      locationRows.push({ icon: 'location-outline', label: 'Şehir / İlçe', value: locationCity });
    }
    if (detail?.address?.trim()) {
      locationRows.push({ icon: 'navigate-outline', label: 'Açık Adres', value: detail.address.trim() });
    }
    if (locationRows.length > 0) {
      sections.push({ id: 'location-section', title: 'Konum ve Adres', rows: locationRows });
    }

    // 4. Career Performance (for race horses)
    if (hasHorseData && horse && horse.career && horse.career.starts > 0) {
      sections.push({
        id: 'horse-performance',
        title: 'Performans ve Kazanç',
        rows: [
          { icon: 'trophy-outline', label: 'Kariyer', value: `${horse.career.starts} start · ${horse.career.first}-${horse.career.second}-${horse.career.third}` },
          ...(horse.handicap ? [{ icon: 'speedometer-outline' as const, label: 'Handikap', value: String(horse.handicap) }] : []),
        ],
      });
    }

    // Distribute sections across row1 (up to 3 sections) and row2 (remaining)
    const r1 = sections.slice(0, 3);
    const r2 = sections.slice(3);

    const titleText = hasHorseData ? 'Genel Bilgiler' : 'İlan Özellikleri ve Detaylar';

    return {
      title: titleText,
      row1: r1,
      row2: r2,
      hasRaces: Boolean(hasHorseData && horse && horse.races && horse.races.length > 0),
    };
  }, [detail, groups, horse, locationCity]);

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
              Yarış Geçmişi
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
