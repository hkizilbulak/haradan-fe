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
import { formatMoney } from '@/utils/formatMoney';
import { AdvertPedigree } from './AdvertPedigree';
import { AdvertSiblings } from './AdvertSiblings';
import { AdvertStatistics } from './AdvertStatistics';
import {
  buildAdvertInfoRows,
  getAdvertCategoryKind,
  getAdvertCategoryName,
  isRaceHorseAdvert,
  parseHorseInfo,
  parsePansiyonInfo,
  parseStudInfo,
  parseTransportInfo,
} from './advertCategoryHelper';

import { getTjkHorseUrl, openTjkHorseSearch } from '@/utils/tjkLinks';
export { getTjkHorseUrl, openTjkHorseSearch };

export type SpecsSubTab = 'specs' | 'pedigree' | 'siblings' | 'statistics';

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

  const location = useAdvertLocation(detail);
  const horse = detail?.horse ?? propHorse;
  const categoryKind = useMemo(() => (detail ? getAdvertCategoryKind(detail) : 'horse'), [detail]);

  const { title, sections } = useMemo(() => {
    const effectiveDetail = detail || ({ horse, specs: groups, title: '' } as AdvertDetail);
    const rows: SoftRow[] = buildAdvertInfoRows(effectiveDetail);

    return {
      title: 'Genel Bilgiler',
      sections: [
        {
          id: 'general-specs',
          title: 'Genel Bilgiler',
          icon: 'information-circle-outline',
          rows,
        },
      ],
    };
  }, [detail, horse, groups]);

  const isHorseOrStud = categoryKind === 'horse' || categoryKind === 'stud';

  const hasPedigree = Boolean(isHorseOrStud && horse?.pedigree && horse.pedigree.length > 0);
  const hasSiblings = Boolean(isHorseOrStud && horse?.siblings && horse.siblings.length > 0);
  const hasStatistics = Boolean(
    isHorseOrStud && (
      (horse?.statistics && horse.statistics.length > 0) ||
      horse?.detailProfile?.handicapPoint ||
      (horse?.handicap != null && horse.handicap > 0)
    )
  );

  const hasHorseData = Boolean(
    isHorseOrStud &&
    horse && (
      (horse.registeredName && horse.registeredName !== 'Başlıksız ilan' && horse.registeredName.trim() !== '') ||
      horse.sire ||
      horse.dam ||
      horse.damsire ||
      (horse.age != null && Boolean(horse.age) && horse.age !== 0) ||
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
    }[] = [];

    list.push({ key: 'specs', label: 'Genel Bilgiler', icon: 'information-circle-outline' });

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
  }, [isWide, hasPedigree, hasStatistics, hasHorseData, hasSiblings, horse?.sire, horse?.dam, horse?.siblings]);

  const defaultTab = subTabs[0]?.key ?? 'specs';
  const [currentTab, setCurrentTab] = useState<SpecsSubTab>(activeSubTab ?? defaultTab);

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    } else if (subTabs.length > 0 && !subTabs.some((t) => t.key === currentTab)) {
      setCurrentTab(subTabs[0].key);
    }
  }, [activeSubTab, subTabs]);

  if (subTabs.length === 0) return null;

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
                {/* Card Header (sadece geniş ekranda gösterilir, mobilde sekme başlığı zaten mevcuttur) */}
                {isWide ? (
                  <View style={[styles.cardHeader, { borderBottomColor: border }]}>
                    <Text style={[styles.cardTitle, { color: text }]}>{section.title}</Text>
                  </View>
                ) : null}

                {/* Card Content List */}
                <View style={styles.rowsGrid}>
                  {section.rows.map((row, idx) => {
                    const isClickable = Boolean(row.onPress);
                    const isLast = idx === section.rows.length - 1;
                    return (
                      <Pressable
                        key={`${section.id}-${row.label}`}
                        onPress={row.onPress}
                        disabled={!isClickable}
                        style={({ pressed }) => [
                          styles.rowItem,
                          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
                          isClickable && styles.rowItemClickable,
                          pressed && isClickable && { opacity: 0.7 },
                        ]}
                      >
                        <View style={styles.rowLeft}>
                          <Text style={[styles.rowLabel, { color: textSecondary }]} numberOfLines={1}>
                            {row.label}
                          </Text>
                        </View>

                        <View style={styles.rowRight}>
                          <View style={styles.rowValueRow}>
                            <Text
                              style={[
                                styles.rowValue,
                                { color: text },
                                isClickable && { color: primary, textDecorationLine: 'underline' },
                              ]}
                              numberOfLines={1}
                            >
                              {row.value}
                            </Text>
                            {isClickable ? (
                              <Ionicons
                                name="open-outline"
                                size={12}
                                color={primary}
                                style={{ marginLeft: 4 }}
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
    width: '100%',
  },
  sectionCardMobile: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    gap: 0,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
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
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 0,
    maxWidth: '52%',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    minWidth: 0,
  },
  rowValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rowIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  rowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'right',
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
