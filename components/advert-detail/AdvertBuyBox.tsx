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
import type { AdvertDetail } from '@/types';
import {
  getAdvertCategoryKind,
  parsePansiyonInfo,
  parseStudInfo,
  parseTransportInfo,
} from './advertCategoryHelper';
import { openTjkHorseSearch } from './AdvertSpecs';

type AdvertBuyBoxProps = {
  detail: AdvertDetail;
  favorite?: boolean;
  isOwner?: boolean;
  variant?: 'default' | 'mobile';
  onToggleFavorite?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEdit?: () => void;
};

type InfoRow = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  isBoolean?: boolean;
};

function normalizeLabel(raw: string): string {
  const norm = (raw || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/['’`"]/g, '')
    .trim();

  if (
    norm.includes('adın') ||
    norm.includes('adin') ||
    norm === 'adinda' ||
    norm === 'adında' ||
    norm.includes('at adi') ||
    norm.includes('at adı') ||
    norm.includes('isim') ||
    norm === 'ad' ||
    norm === 'adı' ||
    norm === 'adi'
  ) {
    return 'At Adı';
  }
  if (
    norm.includes('irk') ||
    norm.includes('ırk') ||
    norm.includes('breed') ||
    norm.includes('cins') ||
    norm.includes('safkan')
  ) {
    return 'At Irkı';
  }
  if (norm.includes('cinsiyet') || norm.includes('gender')) {
    return 'Cinsiyet';
  }
  if (norm.includes('don') || norm.includes('renk') || norm.includes('coat')) {
    return 'Donu';
  }
  if (norm.includes('yaş') || norm.includes('yas') || norm.includes('age')) {
    return 'Yaş';
  }
  if (
    norm.includes('kısrak babası') ||
    norm.includes('kisrak babasi') ||
    norm.includes('annesinin baba') ||
    norm.includes('damsire')
  ) {
    return 'Annesinin Baba Adı';
  }
  if (norm.includes('baba') || norm.includes('sire')) {
    return 'Baba Adı';
  }
  if (norm.includes('anne') || norm.includes('dam')) {
    return 'Anne Adı';
  }
  if (norm.includes('idman') || norm.includes('intraining')) {
    return 'İdmanda mı';
  }
  if (norm.includes('kira') || norm.includes('isforrent')) {
    return 'Kiralık mı';
  }
  if (norm.includes('kosar') || norm.includes('koşar') || norm.includes('israceready')) {
    return 'Koşar durumda mı';
  }
  return raw;
}

function getRowIcon(label: string): keyof typeof Ionicons.glyphMap {
  const l = (label || '').toLowerCase();
  if (l.includes('ilan no') || l.includes('no')) return 'pricetag-outline';
  if (l.includes('tarih')) return 'calendar-outline';
  if (l.includes('kategori')) return 'grid-outline';
  if (l.includes('at adı') || l.includes('ad')) return 'star-outline';
  if (l.includes('annesinin baba') || l.includes('kısrak babası')) return 'git-network-outline';
  if (l.includes('baba') || l.includes('anne')) return 'git-branch-outline';
  if (l.includes('irk') || l.includes('ırk')) return 'ribbon-outline';
  if (l.includes('yaş') || l.includes('yas')) return 'time-outline';
  if (l.includes('cinsiyet')) return 'male-female-outline';
  if (l.includes('don')) return 'color-palette-outline';
  if (l.includes('idman')) return 'fitness-outline';
  if (l.includes('kira')) return 'key-outline';
  if (l.includes('koşar') || l.includes('kosar')) return 'flash-outline';
  if (l.includes('padok') || l.includes('çim') || l.includes('kum')) return 'leaf-outline';
  if (l.includes('doğum')) return 'home-outline';
  if (l.includes('nalbant')) return 'hammer-outline';
  if (l.includes('vet') || l.includes('sağlık')) return 'medkit-outline';
  if (l.includes('firma')) return 'business-outline';
  if (l.includes('web')) return 'globe-outline';
  return 'information-circle-outline';
}

/** Sağ kolon — Yüksek kaliteli Genel Bilgiler tablosu ve ilan açıklaması. */
export const AdvertBuyBox = memo(function AdvertBuyBox({
  detail,
  variant = 'default',
}: AdvertBuyBoxProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const categoryName = useMemo(() => {
    return (
      (detail.breadcrumbs && detail.breadcrumbs.length > 1
        ? detail.breadcrumbs[detail.breadcrumbs.length - 2]?.label
        : '') ||
      (detail as any)?.category?.name ||
      detail.horse?.breed ||
      'Satılık Yarış Atı'
    );
  }, [detail]);

  const infoRows = useMemo(() => {
    const list: InfoRow[] = [];

    // 1. İlan No
    list.push({
      label: 'İlan No',
      value: detail.id ? String(detail.id) : '-',
      icon: 'pricetag-outline',
    });

    // 2. İlan Tarihi
    const formatPublishDate = (dateStr?: string | null): string => {
      if (!dateStr) return '-';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };
    list.push({
      label: 'İlan Tarihi',
      value: formatPublishDate(detail.publishedAt),
      icon: 'calendar-outline',
    });

    // 3. Kategori
    list.push({
      label: 'Kategori',
      value: categoryName,
      icon: 'grid-outline',
    });

    const categoryKind = getAdvertCategoryKind(detail);

    if (categoryKind === 'pansiyon') {
      const pansiyonInfo = parsePansiyonInfo(detail);
      list.push({ label: 'Çim Padok', value: pansiyonInfo.hasGrassPaddock ? 'Evet' : 'Hayır', icon: 'leaf-outline', isBoolean: true });
      list.push({ label: 'Kum Padok', value: pansiyonInfo.hasSandPaddock ? 'Evet' : 'Hayır', icon: 'leaf-outline', isBoolean: true });
      list.push({ label: 'Aygır Padoğu', value: pansiyonInfo.hasStallionPaddock ? 'Evet' : 'Hayır', icon: 'leaf-outline', isBoolean: true });
      list.push({ label: 'Doğumhane', value: pansiyonInfo.hasFoalingBarn ? 'Evet' : 'Hayır', icon: 'home-outline', isBoolean: true });
      list.push({ label: 'Nalbant', value: pansiyonInfo.hasFarrier ? 'Evet' : 'Hayır', icon: 'hammer-outline', isBoolean: true });
      list.push({ label: 'Veteriner Hekim', value: pansiyonInfo.hasVeterinarian ? 'Evet' : 'Hayır', icon: 'medkit-outline', isBoolean: true });
      if (pansiyonInfo.trainingTrack) {
        list.push({ label: 'İdman Pisti', value: pansiyonInfo.trainingTrack, icon: 'fitness-outline' });
      }
    } else if (categoryKind === 'transport') {
      const transportInfo = parseTransportInfo(detail);
      if (transportInfo.companyName) {
        list.push({ label: 'Firma Adı', value: transportInfo.companyName, icon: 'business-outline' });
      }
      if (transportInfo.websiteUrl) {
        list.push({ label: 'Web Sitesi', value: transportInfo.websiteUrl, icon: 'globe-outline' });
      }
      list.push({ label: 'Hizmet', value: 'At Nakliyesi & Taşımacılık', icon: 'car-outline' });
    } else if (categoryKind === 'stud') {
      const studInfo = parseStudInfo(detail);
      if (studInfo.name) list.push({ label: 'Aygır Adı', value: studInfo.name, icon: 'star-outline' });
      if (studInfo.breed) list.push({ label: 'At Irkı', value: studInfo.breed, icon: 'ribbon-outline' });
      if (studInfo.age) list.push({ label: 'Yaş', value: studInfo.age.includes('ya') || studInfo.age.includes('Ya') ? studInfo.age : `${studInfo.age} Yaş`, icon: 'time-outline' });
      if (studInfo.coatColor) list.push({ label: 'Donu', value: studInfo.coatColor, icon: 'color-palette-outline' });
      if (studInfo.sire) {
        list.push({
          label: 'Baba Adı',
          value: studInfo.sire,
          icon: 'git-branch-outline',
          onPress: studInfo.sire !== '-' ? () => openTjkHorseSearch(studInfo.sire) : undefined,
        });
      }
      if (studInfo.dam) {
        list.push({
          label: 'Anne Adı',
          value: studInfo.dam,
          icon: 'git-branch-outline',
          onPress: studInfo.dam !== '-' ? () => openTjkHorseSearch(studInfo.dam) : undefined,
        });
      }
      if (studInfo.damsire) {
        list.push({
          label: 'Annesinin Baba Adı',
          value: studInfo.damsire,
          icon: 'git-network-outline',
          onPress: studInfo.damsire !== '-' ? () => openTjkHorseSearch(studInfo.damsire) : undefined,
        });
      }
    } else {
      // Horse advert
      const horse = detail.horse;

      // At Adı
      list.push({
        label: 'At Adı',
        value: horse?.registeredName || detail.title || '-',
        icon: 'star-outline',
      });

      // Baba Adı
      const sireName = horse?.sire || '-';
      list.push({
        label: 'Baba Adı',
        value: sireName,
        icon: 'git-branch-outline',
        onPress: sireName && sireName !== '-' ? () => openTjkHorseSearch(sireName) : undefined,
      });

      // Anne Adı
      const damName = horse?.dam || '-';
      list.push({
        label: 'Anne Adı',
        value: damName,
        icon: 'git-branch-outline',
        onPress: damName && damName !== '-' ? () => openTjkHorseSearch(damName) : undefined,
      });

      // Annesinin Baba Adı
      const damsireName = horse?.damsire || '-';
      list.push({
        label: 'Annesinin Baba Adı',
        value: damsireName,
        icon: 'git-network-outline',
        onPress: damsireName && damsireName !== '-' ? () => openTjkHorseSearch(damsireName) : undefined,
      });

      // At Irkı
      const breed = horse?.breed || (detail as any)?.properties?.breed || (detail as any)?.horse?.breed || 'İngiliz';
      list.push({
        label: 'At Irkı',
        value: breed,
        icon: 'ribbon-outline',
      });

      // Yaş
      if (horse?.age && horse.age > 0) {
        list.push({
          label: 'Yaş',
          value: `${horse.age} Yaş`,
          icon: 'time-outline',
        });
      }

      // Cinsiyet
      const gender = horse?.gender || (detail as any)?.properties?.gender || (detail as any)?.properties?.cinsiyet || '-';
      list.push({
        label: 'Cinsiyet',
        value: gender,
        icon: 'male-female-outline',
      });

      // Donu
      const coat = horse?.coatColor || (detail as any)?.properties?.coatColor || (detail as any)?.properties?.don || '-';
      list.push({
        label: 'Donu',
        value: coat,
        icon: 'color-palette-outline',
      });

      // Helper to find boolean / string properties
      const findProp = (codes: string[], defaultVal: boolean): string => {
        const rawProps = (detail as any)?.properties || {};
        for (const c of codes) {
          const val = rawProps[c] ?? rawProps[c.toLowerCase()] ?? rawProps[c.toUpperCase()];
          if (val != null) {
            if (typeof val === 'boolean') return val ? 'Evet' : 'Hayır';
            if (typeof val === 'string') {
              const lower = val.toLowerCase().trim();
              if (lower === 'true' || lower === 'evet') return 'Evet';
              if (lower === 'false' || lower === 'hayır' || lower === 'hayir') return 'Hayır';
              return val;
            }
          }
        }
        for (const g of detail.specs ?? []) {
          for (const r of g.rows ?? []) {
            const l = (r.label || '').toLowerCase();
            for (const c of codes) {
              if (l.includes(c.toLowerCase())) {
                const v = String(r.value).toLowerCase().trim();
                if (v === 'true' || v === 'evet') return 'Evet';
                if (v === 'false' || v === 'hayır' || v === 'hayir') return 'Hayır';
                return String(r.value);
              }
            }
          }
        }
        return defaultVal ? 'Evet' : 'Hayır';
      };

      list.push({
        label: 'İdmanda mı',
        value: findProp(['IN_TRAINING', 'inTraining', 'idmanda'], true),
        icon: 'fitness-outline',
        isBoolean: true,
      });

      list.push({
        label: 'Kiralık mı',
        value: findProp(['IS_FOR_RENT', 'isForRent', 'kiralik', 'kiralık'], false),
        icon: 'key-outline',
        isBoolean: true,
      });

      list.push({
        label: 'Koşar durumda mı',
        value: findProp(['IS_RACE_READY', 'isRaceReady', 'kosar', 'koşar'], true),
        icon: 'flash-outline',
        isBoolean: true,
      });
    }

    return list.map((item) => ({
      ...item,
      label: normalizeLabel(item.label),
      icon: getRowIcon(item.label),
    }));
  }, [detail, categoryName]);

  return (
    <View style={styles.wrap}>
      {/* Genel Bilgiler Tablosu */}
      <View style={[styles.infoTableCard, { backgroundColor: surface, borderColor: border }]}>
        <View style={[styles.infoTableHeader, { borderBottomColor: border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconBox, { backgroundColor: `${primary}20` }]}>
              <Ionicons name="information-circle" size={18} color={primary} />
            </View>
            <Text style={[styles.infoTableTitle, { color: text }]}>Genel Bilgiler</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: `${primary}14`, borderColor: `${primary}30` }]}>
            <Text style={[styles.categoryBadgeText, { color: primary }]} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>
        </View>

        <View style={styles.infoTableBody}>
          {infoRows.map((row, idx) => {
            const isLast = idx === infoRows.length - 1;
            const isClickable = Boolean(row.onPress);
            return (
              <View
                key={`${row.label}-${idx}`}
                style={[
                  styles.infoTableRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
                ]}
              >
                <View style={styles.rowLabelWrap}>
                  <View style={[styles.rowIconWrap, { borderColor: border }]}>
                    <Ionicons name={row.icon} size={14} color={textMuted} />
                  </View>
                  <Text style={[styles.infoRowLabel, { color: textSecondary }]}>{row.label}</Text>
                </View>

                {isClickable ? (
                  <Pressable
                    onPress={row.onPress}
                    style={({ pressed }) => [
                      styles.clickableChip,
                      { backgroundColor: `${primary}16`, borderColor: `${primary}35` },
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clickableChipText,
                        { color: primary },
                      ]}
                      numberOfLines={1}
                    >
                      {row.value}
                    </Text>
                    <Ionicons name="open-outline" size={12} color={primary} style={{ marginLeft: 3 }} />
                  </Pressable>
                ) : row.isBoolean && (row.value === 'Evet' || row.value === 'Hayır') ? (
                  <View
                    style={[
                      styles.booleanBadge,
                      row.value === 'Evet'
                        ? styles.booleanBadgeSuccess
                        : styles.booleanBadgeDanger,
                    ]}
                  >
                    <Ionicons
                      name={row.value === 'Evet' ? 'checkmark' : 'close'}
                      size={12}
                      color={row.value === 'Evet' ? '#22c55e' : '#ef4444'}
                    />
                    <Text
                      style={[
                        styles.booleanBadgeText,
                        { color: row.value === 'Evet' ? '#22c55e' : '#ef4444' },
                      ]}
                    >
                      {row.value}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.infoRowValue, { color: text }]} numberOfLines={1}>
                    {row.value}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {detail.description ? (
        <View style={[styles.descCard, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.descHeader}>
            <Ionicons name="document-text-outline" size={16} color={textMuted} />
            <Text style={[styles.blockLabel, { color: text }]}>
              İlan Açıklaması
            </Text>
          </View>
          <Text style={[styles.desc, { color: textSecondary }]}>
            {detail.description}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  infoTableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  infoTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTableTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '45%',
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  infoTableBody: {
    paddingVertical: 4,
  },
  infoTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  rowIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  infoRowLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  infoRowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  clickableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      } as any,
      default: {},
    }),
  },
  clickableChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  booleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  booleanBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  booleanBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.24)',
  },
  booleanBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  descCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: '400',
  },
});
