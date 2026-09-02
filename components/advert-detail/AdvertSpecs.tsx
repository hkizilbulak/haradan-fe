import React, { memo, useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
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
  icon: keyof typeof Ionicons.glyphMap;
  rows: SoftRow[];
};

function getSpecIcon(label: string): keyof typeof Ionicons.glyphMap {
  const l = (label || '').toLowerCase().trim();

  // 1. Cinsiyet / Gender (Must check before 'cins' / 'irk')
  if (l.includes('cinsiyet') || l.includes('gender')) return 'male-female-outline';

  // 2. Doğum tarihi / Yaş / Yıl / Tarih (Must check before 'doğumhane')
  if (l.includes('tarih') || l.includes('doğum') || l.includes('dogum') || l.includes('yaş') || l.includes('yas') || l.includes('age') || l.includes('yıl') || l.includes('yil') || l.includes('year')) {
    return 'calendar-outline';
  }

  // 3. Şecere / Kimlik / Belge / Pasaport / TJK No
  if (l.includes('şecere') || l.includes('secere') || l.includes('kimlik') || l.includes('belge') || l.includes('evrak') || l.includes('pasaport') || l.includes('tjk')) {
    return 'document-text-outline';
  }

  // 4. İnceleme / Ziyaret / Yerinde / Deneme
  if (l.includes('inceleme') || l.includes('ziyaret') || l.includes('yerinde') || l.includes('deneme') || l.includes('biniş') || l.includes('binis')) {
    return 'eye-outline';
  }

  // 5. Sağlık / Aşı / Veteriner / Rapor
  if (l.includes('vet') || l.includes('sağlık') || l.includes('saglik') || l.includes('aşı') || l.includes('asi') || l.includes('hekim') || l.includes('tedavi') || l.includes('rapor')) {
    return 'medkit-outline';
  }

  // 6. Pedigree / Soyağacı (Kısrak Babası, Baba, Anne)
  if (l.includes('kısrak babası') || l.includes('kisrak babasi') || l.includes('damsire')) {
    return 'git-network-outline';
  }
  if (l.includes('baba') || l.includes('sire') || l.includes('anne') || l.includes('dam') || l.includes('pedigree') || l.includes('soyağac') || l.includes('soyagac') || l.includes('orijin')) {
    return 'git-branch-outline';
  }

  // 7. Don / Renk
  if (l.includes('don') || l.includes('renk') || l.includes('coat') || l.includes('color')) {
    return 'color-palette-outline';
  }

  // 8. At Adı / İsim
  if (l.includes('at adı') || l.includes('at adi') || l.includes('isim') || l.includes('horse name') || l === 'ad' || l === 'adı' || l === 'adi') {
    return 'star-outline';
  }

  // 9. Irk / Cins / Safkan
  if (l.includes('irk') || l.includes('ırk') || l.includes('breed') || l.includes('cins') || l.includes('safkan')) {
    return 'ribbon-outline';
  }

  // 10. Tesis / Padok / Ahır / Doğumhane
  if (l.includes('doğumhane') || l.includes('dogumhane') || l.includes('barn') || l.includes('ahır') || l.includes('ahir') || l.includes('hara')) {
    return 'home-outline';
  }
  if (l.includes('padok') || l.includes('paddock') || l.includes('çim') || l.includes('cim') || l.includes('kum')) {
    return 'leaf-outline';
  }
  if (l.includes('nalbant') || l.includes('farrier') || l.includes('bakım') || l.includes('bakim')) {
    return 'hammer-outline';
  }
  if (l.includes('pist') || l.includes('track') || l.includes('idman') || l.includes('antren') || l.includes('koşu') || l.includes('kosu') || l.includes('kariyer')) {
    return 'trophy-outline';
  }

  // 11. Kişiler / Firma / İletişim / Konum
  if (l.includes('sahip') || l.includes('yetiştirici') || l.includes('yetistirici') || l.includes('kişi') || l.includes('kisi') || l.includes('person') || l.includes('antrenör') || l.includes('antrenor') || l.includes('trainer')) {
    return 'person-outline';
  }
  if (l.includes('firma') || l.includes('şirket') || l.includes('sirket') || l.includes('company')) {
    return 'business-outline';
  }
  if (l.includes('web') || l.includes('site') || l.includes('url')) {
    return 'globe-outline';
  }
  if (l.includes('telefon') || l.includes('phone') || l.includes('iletişim') || l.includes('iletisim') || l.includes('gsm')) {
    return 'call-outline';
  }
  if (l.includes('konum') || l.includes('şehir') || l.includes('sehir') || l.includes('ilçe') || l.includes('ilce') || l.includes('adres')) {
    return 'location-outline';
  }
  if (l.includes('kamera') || l.includes('video') || l.includes('güvenlik') || l.includes('guvenlik')) {
    return 'videocam-outline';
  }
  if (l.includes('garanti') || l.includes('aşım') || l.includes('asim')) {
    return 'shield-checkmark-outline';
  }
  if (l.includes('cidago') || l.includes('boy') || l.includes('ölçü') || l.includes('olcu') || l.includes('height')) {
    return 'resize-outline';
  }
  if (l.includes('fiyat') || l.includes('ücret') || l.includes('ucret') || l.includes('ödeme') || l.includes('odeme') || l.includes('price')) {
    return 'pricetag-outline';
  }

  return 'information-circle-outline';
}

function getSectionIcon(id: string, title: string): keyof typeof Ionicons.glyphMap {
  const l = (title || id || '').toLowerCase();
  if (id === 'horse-identity' || l.includes('kimlik')) return 'ribbon-outline';
  if (id === 'horse-pedigree' || l.includes('orijin') || l.includes('soy')) return 'git-branch-outline';
  if (id === 'horse-people' || l.includes('kişi')) return 'people-outline';
  if (id === 'location-section' || l.includes('konum') || l.includes('adres')) return 'location-outline';
  if (id === 'horse-performance' || l.includes('performans')) return 'trophy-outline';
  return 'options-outline';
}

function isDuplicateHorseField(label: string): boolean {
  const norm = (label || '')
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/g, '')
    .trim();

  const duplicates = new Set([
    'atadi',
    'atadı',
    'isim',
    'ad',
    'adi',
    'adı',
    'horsename',
    'atirki',
    'atırkı',
    'irk',
    'ırk',
    'breed',
    'cins',
    'cinsirk',
    'cinsırk',
    'safkan',
    'don',
    'donu',
    'donurenk',
    'renk',
    'coatcolor',
    'yas',
    'yaş',
    'age',
    'cinsiyet',
    'gender',
    'dogumtarihi',
    'doğumtarihi',
    'dogumyili',
    'doğumyılı',
    'dogum',
    'doğum',
    'birthdate',
    'cidago',
    'boy',
    'yukseklik',
    'yükseklik',
    'height',
    'heightcm',
    'baba',
    'babaadi',
    'babaadı',
    'sire',
    'anne',
    'anneadi',
    'anneadı',
    'dam',
    'kisrakbabasi',
    'kısrakbabası',
    'anneninbabasi',
    'anneninbabası',
    'damsire',
    'sahip',
    'owner',
    'atsahibi',
    'yetistirici',
    'yetiştirici',
    'breeder',
    'antrenor',
    'antrenör',
    'trainer',
  ]);

  return duplicates.has(norm);
}

/** Genel bilgiler — kart bazlı, yüksek kontrastlı, mobil uyumlu ilan detay özellikleri. */
export const AdvertSpecs = memo(function AdvertSpecs({
  groups,
  horse: propHorse,
  detail,
}: AdvertSpecsProps) {
  const isWide = useIsWideLayout();

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');

  const horse = detail?.horse ?? propHorse;
  const rawLocation = useAdvertLocation(detail);
  const locationCity = rawLocation || 'Belirtilmedi';

  const { title, sections, hasRaces } = useMemo(() => {
    const list: SoftSection[] = [];

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
        list.push({
          id: 'horse-identity',
          title: 'Kimlik ve Fiziksel',
          icon: 'ribbon-outline',
          rows: identity,
        });
      }

      const pedigree: SoftRow[] = [];
      if (horse.sire) pedigree.push({ icon: 'git-branch-outline', label: 'Baba', value: horse.sire });
      if (horse.dam) pedigree.push({ icon: 'git-branch-outline', label: 'Anne', value: horse.dam });
      if (horse.damsire) pedigree.push({ icon: 'git-network-outline', label: 'Kısrak Babası', value: horse.damsire });

      if (pedigree.length > 0) {
        list.push({
          id: 'horse-pedigree',
          title: 'Orijin (Soy Ağacı)',
          icon: 'git-branch-outline',
          rows: pedigree,
        });
      }

      const people: SoftRow[] = [];
      if (horse.owners && horse.owners.length > 0) people.push({ icon: 'person-outline', label: 'Sahip', value: horse.owners.join(', ') });
      if (horse.breeder) people.push({ icon: 'home-outline', label: 'Yetiştirici', value: horse.breeder });
      if (horse.trainer) people.push({ icon: 'fitness-outline', label: 'Antrenör', value: horse.trainer });

      if (people.length > 0) {
        list.push({
          id: 'horse-people',
          title: 'İlgili Kişiler',
          icon: 'people-outline',
          rows: people,
        });
      }
    }

    // 2. Dynamic Resolved Category Properties
    const allGroups = groups && groups.length > 0 ? groups : (detail?.specs ?? []);
    for (const g of allGroups) {
      if (g && g.rows && g.rows.length > 0) {
        const validRows: SoftRow[] = g.rows
          .filter((r) => {
            if (!r.label || r.value == null) return false;
            const valStr = String(r.value).trim();
            if (valStr === '' || valStr === 'null' || valStr === 'undefined') return false;
            if (hasHorseData && isDuplicateHorseField(r.label)) return false;
            return true;
          })
          .map((r) => ({
            icon: getSpecIcon(r.label),
            label: r.label,
            value: String(r.value),
            hint: r.hint,
          }));
        if (validRows.length > 0) {
          const gTitle = g.title || 'Özellikler';
          list.push({
            id: g.id || 'category-specs',
            title: gTitle,
            icon: getSectionIcon(g.id || '', gTitle),
            rows: validRows,
          });
        }
      }
    }

    // 3. Location and Address
    const locationRows: SoftRow[] = [];
    if (locationCity && locationCity !== 'Belirtilmedi') {
      locationRows.push({ icon: 'location-outline', label: 'Şehir / İlçe', value: locationCity });
    }
    if (detail?.address?.trim()) {
      locationRows.push({ icon: 'navigate-outline', label: 'Açık Adres', value: detail.address.trim() });
    }
    if (locationRows.length > 0) {
      list.push({
        id: 'location-section',
        title: 'Konum ve Adres',
        icon: 'location-outline',
        rows: locationRows,
      });
    }

    // 4. Career Performance
    if (hasHorseData && horse && horse.career && horse.career.starts > 0) {
      list.push({
        id: 'horse-performance',
        title: 'Performans ve Kazanç',
        icon: 'trophy-outline',
        rows: [
          { icon: 'trophy-outline', label: 'Kariyer', value: `${horse.career.starts} start · ${horse.career.first}-${horse.career.second}-${horse.career.third}` },
          ...(horse.handicap ? [{ icon: 'speedometer-outline' as const, label: 'Handikap', value: String(horse.handicap) }] : []),
        ],
      });
    }

    const titleText = hasHorseData ? 'Genel Bilgiler' : 'İlan Özellikleri ve Detaylar';

    return {
      title: titleText,
      sections: list,
      hasRaces: Boolean(hasHorseData && horse && horse.races && horse.races.length > 0),
    };
  }, [detail, groups, horse, locationCity]);

  if (sections.length === 0 && !hasRaces) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.pageTitle, { color: text }]}>{title}</Text>

      <View style={[styles.grid, !isWide && styles.gridMobile]}>
        {sections.map((section) => (
          <View
            key={section.id}
            style={[
              styles.sectionCard,
              { backgroundColor: surface, borderColor: border },
              isWide ? styles.sectionCardWide : styles.sectionCardMobile,
            ]}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.headerIconWrap, { backgroundColor: `${primary}15` }]}>
                <Ionicons name={section.icon} size={16} color={primary} />
              </View>
              <Text style={[styles.cardTitle, { color: text }]}>{section.title}</Text>
            </View>

            {/* Card Content Grid */}
            <View style={styles.rowsGrid}>
              {section.rows.map((row) => (
                <View key={`${section.id}-${row.label}`} style={styles.rowItem}>
                  <View style={[styles.rowIconWrap, { borderColor: border }]}>
                    <Ionicons name={row.icon} size={15} color={textSecondary} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, { color: textSecondary }]}>
                      {row.label}
                    </Text>
                    <Text style={[styles.rowValue, { color: text }]}>
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
        ))}
      </View>

      {hasRaces && horse ? (
        <View
          style={[
            styles.sectionCard,
            styles.sectionCardMobile,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.headerIconWrap, { backgroundColor: `${primary}15` }]}>
              <Ionicons name="trophy-outline" size={16} color={primary} />
            </View>
            <Text style={[styles.cardTitle, { color: text }]}>Yarış Geçmişi</Text>
          </View>

          <View style={styles.raceList}>
            {horse.races.slice(0, 5).map((race) => (
              <View key={race.id} style={[styles.raceRow, { borderBottomColor: border }]}>
                <Text style={[styles.racePlace, { color: primary }]}>
                  {race.place}.
                </Text>
                <View style={styles.raceCopy}>
                  <Text style={[styles.raceVenue, { color: text }]} numberOfLines={1}>
                    {race.venue}
                  </Text>
                  <Text style={[styles.raceMeta, { color: textSecondary }]}>
                    {race.date} · {race.distance} · {race.surface}
                  </Text>
                </View>
                {race.videoUrl ? (
                  <Pressable
                    onPress={() => Linking.openURL(race.videoUrl!)}
                    hitSlop={8}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="play-circle" size={22} color={primary} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: 14,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
      default: {},
    }),
  },
  sectionCardWide: {
    width: '48.5%',
    flexGrow: 1,
  },
  sectionCardMobile: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowsGrid: {
    gap: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  rowHint: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  raceList: {
    gap: 10,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  racePlace: {
    fontSize: 15,
    fontWeight: '800',
    width: 24,
  },
  raceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  raceVenue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  raceMeta: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
