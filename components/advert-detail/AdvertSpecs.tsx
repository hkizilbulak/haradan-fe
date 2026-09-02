import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
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
import { AdvertPedigree } from './AdvertPedigree';
import { AdvertSiblings } from './AdvertSiblings';
import { AdvertStatistics } from './AdvertStatistics';

export type SpecsSubTab = 'specs' | 'pedigree' | 'siblings' | 'statistics';

export function openTjkHorseSearch(rawName: string) {
  if (!rawName || rawName === '-') return;
  const cleanName = rawName.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
  // !ducky command directly redirects straight to the #1 top matching page on tjk.org
  const directUrl = `https://duckduckgo.com/?q=%21ducky+site%3Atjk.org+${encodeURIComponent(cleanName)}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  } else {
    void Linking.openURL(directUrl);
  }
}

type AdvertSpecsProps = {
  groups: AdvertSpecGroup[];
  horse?: HorseProfile;
  detail?: AdvertDetail;
  activeSubTab?: SpecsSubTab;
  onSubTabChange?: (tab: SpecsSubTab) => void;
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
  if (l.includes('kiralık') || l.includes('kiralik') || l.includes('kira') || l.includes('rent') || l.includes('lease')) {
    return 'key-outline';
  }
  if (l.includes('koşar') || l.includes('kosar')) {
    return 'flash-outline';
  }
  if (l.includes('idman') || l.includes('antren') || l.includes('training')) {
    return 'fitness-outline';
  }
  if (l.includes('pist') || l.includes('track') || l.includes('koşu') || l.includes('kosu') || l.includes('kariyer')) {
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
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9ğüşıöç]/g, '')
    .trim();

  // Protect race status / highlight / guarantee properties from ever being considered duplicate!
  if (
    norm.includes('idman') ||
    norm.includes('kosar') ||
    norm.includes('koşar') ||
    norm.includes('kira') ||
    norm.includes('saglik') ||
    norm.includes('sağlık') ||
    norm.includes('asi') ||
    norm.includes('aşı') ||
    norm.includes('secere') ||
    norm.includes('şecere') ||
    norm.includes('inceleme') ||
    norm.includes('guvence') ||
    norm.includes('güvence')
  ) {
    return false;
  }

  const duplicates = [
    'irk',
    'ırk',
    'breed',
    'safkan',
    'cins',
    'don',
    'coat',
    'renk',
    'yas',
    'yaş',
    'age',
    'gender',
    'cinsiyet',
    'cidago',
    'height',
    'baba',
    'sire',
    'anne',
    'dam',
    'damsire',
    'sahip',
    'owner',
    'breeder',
    'yetistirici',
    'yetiştirici',
    'trainer',
    'antrenor',
    'antrenör',
    'dogum',
    'doğum',
    'tjk',
    'isim',
    'ad',
    'adi',
    'adı',
  ];

  for (const d of duplicates) {
    if (norm === d || norm.includes(d)) {
      return true;
    }
  }

  return false;
}

function normalizeSpecLabel(label: string): string {
  const upper = (label || '').toUpperCase().replace(/[-_]/g, '').trim();
  if (upper === 'INTRAINING') return 'İdmanda mı';
  if (upper === 'ISRACEREADY' || upper === 'RACEREADY') return 'Koşar durumda mı';
  if (upper === 'ISFORRENT' || upper === 'FORRENT') return 'Kiralık mı';
  if (upper === 'HEALTHVACCINATION') return 'Sağlık ve aşı kaydı';
  if (upper === 'PEDIGREEIDENTITY') return 'Şecere ve kimlik';
  if (upper === 'ONSITEINSPECTION') return 'Yerinde İnceleme';
  return label;
}

/** Genel bilgiler — kart bazlı, yüksek kontrastlı, mobil uyumlu ilan detay özellikleri. */
export const AdvertSpecs = memo(function AdvertSpecs({
  groups,
  horse: propHorse,
  detail,
  activeSubTab,
  onSubTabChange,
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

    let identitySection: SoftSection | null = null;
    let pedigreeSection: SoftSection | null = null;
    let peopleSection: SoftSection | null = null;

    if (hasHorseData && horse) {
      const identity: SoftRow[] = [];
      const horseName = horse.registeredName || detail?.title || '';
      if (horseName) identity.push({ icon: 'ribbon-outline', label: 'İsim', value: horseName });
      if (horse.tjkNumber) identity.push({ icon: 'document-text-outline', label: 'TJK No', value: horse.tjkNumber });
      if (horse.detailProfile?.handicapPoint || (horse.handicap != null && horse.handicap > 0)) {
        identity.push({
          icon: 'speedometer-outline',
          label: 'Handikap',
          value: String(horse.detailProfile?.handicapPoint || horse.handicap),
        });
      }
      if (horse.detailProfile?.ageText) {
        identity.push({
          icon: 'calendar-outline',
          label: 'Yaş / Eşkal',
          value: horse.detailProfile.ageText,
          hint: horse.birthDate || undefined,
        });
      } else if (horse.age != null && horse.age > 0) {
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
        identitySection = {
          id: 'horse-identity',
          title: 'Kimlik ve Fiziksel',
          icon: 'ribbon-outline',
          rows: identity,
        };
      }

      const pedigree: SoftRow[] = [];
      if (horse.sire) {
        pedigree.push({
          icon: 'git-branch-outline',
          label: 'Baba',
          value: horse.sire,
          onPress: () => openTjkHorseSearch(horse.sire!),
        });
      }
      if (horse.dam) {
        pedigree.push({
          icon: 'git-branch-outline',
          label: 'Anne',
          value: horse.dam,
          onPress: () => openTjkHorseSearch(horse.dam!),
        });
      }
      if (horse.damsire) {
        pedigree.push({
          icon: 'git-network-outline',
          label: 'Kısrak Babası',
          value: horse.damsire,
          onPress: () => openTjkHorseSearch(horse.damsire!),
        });
      }

      if (pedigree.length > 0) {
        pedigreeSection = {
          id: 'horse-pedigree',
          title: 'Orijin (Soy Ağacı)',
          icon: 'git-branch-outline',
          rows: pedigree,
        };
      }

      const people: SoftRow[] = [];
      if (horse.owners && horse.owners.length > 0) people.push({ icon: 'person-outline', label: 'Sahip', value: horse.owners.join(', ') });
      if (horse.breeder) people.push({ icon: 'home-outline', label: 'Yetiştirici', value: horse.breeder });
      if (horse.trainer) people.push({ icon: 'fitness-outline', label: 'Antrenör', value: horse.trainer });

      if (people.length > 0) {
        peopleSection = {
          id: 'horse-people',
          title: 'İlgili Kişiler',
          icon: 'people-outline',
          rows: people,
        };
      }
    }

    if (identitySection) {
      list.push(identitySection);
    }

    const isRaceHorseCat =
      detail?.categoryId === 'satilik-yaris-ati' ||
      detail?.categoryId === 'c1000000-0000-4000-8000-000000000011' ||
      (detail as any)?.category?.slug === 'satilik-yaris-ati' ||
      (detail as any)?.category?.id === 'c1000000-0000-4000-8000-000000000011' ||
      Boolean(hasHorseData && horse?.tjkNumber);

    // 2. Dynamic Resolved Category Properties (Placed 2nd so it sits at top-right next to Identity)
    const allGroups = groups && groups.length > 0 ? groups : (detail?.specs ?? []);
    let specsGroupFound = false;

    for (const g of allGroups) {
      if (g && g.rows && g.rows.length > 0) {
        specsGroupFound = true;
        const validRows: SoftRow[] = g.rows
          .filter((r) => {
            if (!r.label || r.value == null) return false;
            const valStr = String(r.value).trim();
            if (valStr === '' || valStr === 'null' || valStr === 'undefined') return false;
            const normLabel = normalizeSpecLabel(r.label);
            if (hasHorseData && isDuplicateHorseField(normLabel)) return false;
            return true;
          })
          .map((r) => {
            const normLabel = normalizeSpecLabel(r.label);
            return {
              icon: getSpecIcon(normLabel),
              label: normLabel,
              value: String(r.value),
              hint: r.hint,
            };
          });

        if (isRaceHorseCat) {
          const rawProps = (detail as any)?.properties || {};
          const statusKeys = [
            { code: 'IN_TRAINING', label: 'İdmanda mı', icon: 'fitness-outline' as const, defaultVal: true },
            { code: 'IS_RACE_READY', label: 'Koşar durumda mı', icon: 'flash-outline' as const, defaultVal: true },
            { code: 'IS_FOR_RENT', label: 'Kiralık mı', icon: 'key-outline' as const, defaultVal: false },
          ];

          let insertOffset = 0;
          for (const item of statusKeys) {
            const exists = validRows.some((r) => r.label === item.label);
            if (!exists) {
              const pVal = rawProps[item.code] ?? rawProps[item.code.toLowerCase()] ?? item.defaultVal;
              validRows.splice(insertOffset, 0, {
                icon: item.icon,
                label: item.label,
                value: typeof pVal === 'boolean' ? (pVal ? 'Evet' : 'Hayır') : String(pVal),
              });
              insertOffset++;
            }
          }
        }

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

    if (!specsGroupFound && isRaceHorseCat) {
      const rawProps = (detail as any)?.properties || {};
      const statusKeys = [
        { code: 'IN_TRAINING', label: 'İdmanda mı', icon: 'fitness-outline' as const, defaultVal: true },
        { code: 'IS_RACE_READY', label: 'Koşar durumda mı', icon: 'flash-outline' as const, defaultVal: true },
        { code: 'IS_FOR_RENT', label: 'Kiralık mı', icon: 'key-outline' as const, defaultVal: false },
      ];
      const validRows: SoftRow[] = statusKeys.map((item) => {
        const pVal = rawProps[item.code] ?? rawProps[item.code.toLowerCase()] ?? item.defaultVal;
        return {
          icon: item.icon,
          label: item.label,
          value: typeof pVal === 'boolean' ? (pVal ? 'Evet' : 'Hayır') : String(pVal),
        };
      });
      list.push({
        id: 'category-specs',
        title: 'Özellikler',
        icon: 'options-outline',
        rows: validRows,
      });
    }

    // 3. Pedigree and People (Placed 3rd and 4th)
    if (pedigreeSection) {
      list.push(pedigreeSection);
    }
    if (peopleSection) {
      list.push(peopleSection);
    }

    // 4. Location and Address
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

    // 5. Career Performance
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

  const hasPedigree = Boolean(horse?.pedigree && horse.pedigree.length > 0);
  const hasSiblings = Boolean(horse?.siblings && horse.siblings.length > 0);
  const hasStatistics = Boolean(
    (horse?.statistics && horse.statistics.length > 0) ||
    horse?.detailProfile?.handicapPoint ||
    (horse?.handicap != null && horse.handicap > 0)
  );

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

  const subTabs = useMemo(() => {
    const list: {
      key: SpecsSubTab;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      badge?: string;
    }[] = [
      { key: 'specs', label: 'Genel Bilgiler', icon: 'information-circle-outline' },
    ];
    if (hasPedigree || (hasHorseData && (horse?.sire || horse?.dam))) {
      list.push({ key: 'pedigree', label: 'Pedigri (Soyağacı)', icon: 'git-branch-outline' });
    }
    if (hasStatistics || hasHorseData) {
      list.push({ key: 'statistics', label: 'İstatistikler', icon: 'stats-chart-outline' });
    }
    if (hasHorseData || hasSiblings) {
      list.push({
        key: 'siblings',
        label: 'Anne Kardeşleri',
        icon: 'people-outline',
        badge: horse?.siblings && horse.siblings.length > 0 ? String(horse.siblings.length) : undefined,
      });
    }
    return list;
  }, [hasPedigree, hasStatistics, hasHorseData, hasSiblings, horse?.sire, horse?.dam, horse?.siblings]);

  const [currentTab, setCurrentTab] = useState<SpecsSubTab>(activeSubTab ?? 'specs');

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  if (sections.length === 0 && !hasRaces && subTabs.length <= 1) return null;

  return (
    <View style={styles.wrap}>
      {/* Sub Tabs Bar */}
      {subTabs.length > 1 ? (
        <View style={styles.subTabBarWrap}>
          <View style={[styles.subTabsContainer, !isWide && styles.subTabsGridMobile]}>
            {subTabs.map((t) => {
              const isActive = t.key === currentTab;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    setCurrentTab(t.key);
                    onSubTabChange?.(t.key);
                  }}
                  style={[
                    styles.subTabButton,
                    !isWide && styles.subTabButtonMobile,
                    {
                      backgroundColor: isActive ? primary : surface,
                      borderColor: isActive ? primary : border,
                    },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={16}
                    color={isActive ? '#ffffff' : textSecondary}
                  />
                  <Text
                    style={[
                      styles.subTabButtonText,
                      !isWide && styles.subTabButtonTextMobile,
                      {
                        color: isActive ? '#ffffff' : text,
                        fontWeight: isActive ? '700' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {t.label}
                  </Text>
                  {t.badge ? (
                    <View
                      style={[
                        styles.subTabBadge,
                        {
                          backgroundColor: isActive
                            ? 'rgba(255, 255, 255, 0.25)'
                            : `${primary}15`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subTabBadgeText,
                          { color: isActive ? '#ffffff' : primary },
                        ]}
                      >
                        {t.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={[styles.pageTitle, { color: text }]}>{title}</Text>
      )}

      {/* Tab: Specs (Genel Bilgiler) */}
      {currentTab === 'specs' && (
        <>
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
                  {section.rows.map((row) => {
                    const isClickable = Boolean(row.onPress);
                    return (
                      <Pressable
                        key={`${section.id}-${row.label}`}
                        onPress={row.onPress}
                        disabled={!isClickable}
                        style={({ pressed }) => [
                          styles.rowItem,
                          isClickable && styles.rowItemClickable,
                          pressed && isClickable && { opacity: 0.7 },
                        ]}
                      >
                        <View style={[styles.rowIconWrap, { borderColor: border }]}>
                          <Ionicons name={row.icon} size={15} color={isClickable ? primary : textSecondary} />
                        </View>
                        <View style={styles.rowContent}>
                          <Text style={[styles.rowLabel, { color: textSecondary }]}>
                            {row.label}
                          </Text>
                          <View style={styles.rowValueRow}>
                            <Text
                              style={[
                                styles.rowValue,
                                { color: text },
                                isClickable && { color: primary, textDecorationLine: 'underline' },
                              ]}
                            >
                              {row.value}
                            </Text>
                            {isClickable ? (
                              <Ionicons
                                name="open-outline"
                                size={13}
                                color={primary}
                                style={{ marginLeft: 4, marginTop: 3 }}
                              />
                            ) : null}
                          </View>
                          {row.hint ? (
                            <Text style={[styles.rowHint, { color: textMuted }]}>
                              {row.hint}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
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
                        {race.date} · {race.distance} · {race.surface.toLowerCase().startsWith('sen') ? 'Sentetik' : race.surface}
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
        </>
      )}

      {/* Tab: Pedigree */}
      {currentTab === 'pedigree' && (
        <AdvertPedigree
          pedigree={horse?.pedigree}
          horseName={horse?.registeredName || detail?.title}
          sireFallback={horse?.sire}
          damFallback={horse?.dam}
          damsireFallback={horse?.damsire}
        />
      )}

      {/* Tab: Siblings */}
      {currentTab === 'siblings' && (
        <AdvertSiblings
          siblings={horse?.siblings}
          damName={horse?.dam}
        />
      )}

      {/* Tab: Statistics */}
      {currentTab === 'statistics' && (
        <AdvertStatistics
          statistics={horse?.statistics}
          handicap={horse?.handicap}
          handicapPoint={horse?.detailProfile?.handicapPoint}
          careerEarnings={horse?.detailProfile?.earning}
        />
      )}
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
  subTabBarWrap: {
    marginBottom: 2,
  },
  subTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
    paddingVertical: 2,
  },
  subTabsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 0,
  },
  subTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  subTabButtonMobile: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: '47%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: 'center',
    gap: 6,
  },
  subTabButtonText: {
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  subTabButtonTextMobile: {
    fontSize: 12,
    flexShrink: 1,
  },
  subTabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  subTabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
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
  rowItemClickable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
      default: {},
    }),
  },
  rowValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
