import React, { memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { HorseStatistic } from '@/types';

type AdvertStatisticsProps = {
  statistics?: HorseStatistic[];
  handicap?: number | null;
  handicapPoint?: string;
  careerEarnings?: string;
};

function formatTjkEarning(raw: string | null | undefined): string {
  if (!raw) return '0 ₺';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/\s*(ton|t|tl|try|₺)$/i, '').trim();
  if (!cleaned || cleaned === '0') return '0 ₺';
  return `${cleaned} ₺`;
}

function normalizeSurfaceLabel(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const rawLower = raw.toLowerCase().trim();

  if (cleaned === 'sen' || cleaned.startsWith('sen') || rawLower.startsWith('sen')) return 'Sentetik';
  if (cleaned === 'cim' || cleaned.startsWith('cim') || rawLower.startsWith('çim')) return 'Çim';
  if (cleaned === 'kum' || cleaned.startsWith('kum') || rawLower.startsWith('kum')) return 'Kum';
  if (cleaned.includes('toplam') || rawLower.includes('toplam')) return 'Genel Toplam';
  return raw.trim();
}

export const AdvertStatistics = memo(function AdvertStatistics({
  statistics,
  handicap,
  handicapPoint,
  careerEarnings,
}: AdvertStatisticsProps) {
  const isWide = useIsWideLayout();

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const list = statistics ?? [];

  const topRow = useMemo(() => {
    return list.find((s) => s.yearLabel.toUpperCase().includes('TOPLAM')) ?? list[0];
  }, [list]);

  const totalRaces = topRow?.raceCount || '0';
  const totalWins = topRow?.first || '0';
  const displayHandicap = handicapPoint || (handicap ? String(handicap) : null);

  const totalPlacements = useMemo(() => {
    const parseNum = (v?: string | null) => parseInt(v || '0', 10) || 0;
    if (topRow && topRow.yearLabel.toUpperCase().includes('TOPLAM')) {
      return parseNum(topRow.first) + parseNum(topRow.second) + parseNum(topRow.third) + parseNum(topRow.fourth);
    }
    return list.reduce((acc, item) => {
      return acc + parseNum(item.first) + parseNum(item.second) + parseNum(item.third) + parseNum(item.fourth);
    }, 0);
  }, [topRow, list]);

  const winRate = useMemo(() => {
    const r = parseInt(totalRaces, 10);
    const w = parseInt(totalWins, 10);
    if (!r || r <= 0) return '0%';
    return `%${Math.round((w / r) * 100)}`;
  }, [totalRaces, totalWins]);

  const placementRate = useMemo(() => {
    const r = parseInt(totalRaces, 10);
    if (!r || r <= 0) return '0%';
    return `%${Math.round((totalPlacements / r) * 100)}`;
  }, [totalRaces, totalPlacements]);

  if (list.length === 0 && !displayHandicap) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: surface, borderColor: border }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: `${textSecondary}15` }]}>
          <Ionicons name="stats-chart-outline" size={32} color={textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: text }]}>
          Kayıtlı İstatistik Bulunamadı
        </Text>
        <Text style={[styles.emptyDesc, { color: textSecondary }]}>
          Bu safkan için TJK sisteminde kayıtlı koşu, pist ve kazanç istatistiği bilgisi bulunmamaktadır.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {/* KPI Cards — Minimalist and Clean */}
      <View style={styles.kpiGrid}>
        {displayHandicap ? (
          <View style={[styles.kpiCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.kpiLabel, { color: textSecondary }]}>Handikap Puanı</Text>
            <Text style={[styles.kpiValue, { color: text }]}>{displayHandicap}</Text>
          </View>
        ) : null}

        <View style={[styles.kpiCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>Toplam Koşu</Text>
          <Text style={[styles.kpiValue, { color: text }]}>{totalRaces} Koşu</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>1.lik / Kazanma</Text>
          <Text style={[styles.kpiValue, { color: text }]}>
            {totalWins} ({winRate})
          </Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.kpiLabel, { color: textSecondary }]}>Toplam Derece</Text>
          <Text style={[styles.kpiValue, { color: text }]}>
            {totalPlacements} ({placementRate})
          </Text>
        </View>
      </View>

      {/* Main Table — Clean, Minimal, High-Legibility */}
      {list.length > 0 ? (
        isWide ? (
          <View style={[styles.tableCard, { backgroundColor: surface, borderColor: border }]}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeaderRow, { borderBottomColor: border }]}>
              <Text style={[styles.th, styles.colLabel, { color: textSecondary }]}>PİST / YIL</Text>
              <Text style={[styles.th, styles.colRaces, { color: textSecondary }]}>KOŞU</Text>
              <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>1.</Text>
              <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>2.</Text>
              <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>3.</Text>
              <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>4.</Text>
              <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>5.</Text>
              <Text style={[styles.th, styles.colEarning, { color: textSecondary }]}>TOPLAM KAZANÇ</Text>
            </View>

            {/* Table Rows */}
            {list.map((item, idx) => {
              const label = normalizeSurfaceLabel(item.yearLabel);
              const isTotal = item.yearLabel.toUpperCase().includes('TOPLAM');
              const formattedEarning = formatTjkEarning(item.earning);

              const parseNum = (v: string) => parseInt(v || '0', 10) || 0;
              const f1 = parseNum(item.first);
              const f2 = parseNum(item.second);
              const f3 = parseNum(item.third);
              const f4 = parseNum(item.fourth);
              const f5 = parseNum(item.fifth);

              return (
                <View
                  key={`${item.yearLabel}-${idx}`}
                  style={[
                    styles.tableRow,
                    isTotal && [styles.totalRow, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }],
                    idx !== list.length - 1 && { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={styles.colLabel}>
                    <Text
                      style={[
                        styles.surfaceText,
                        { color: text },
                        isTotal && styles.totalSurfaceText,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.colRaces,
                      styles.cellNum,
                      isTotal && styles.boldText,
                      { color: text },
                    ]}
                  >
                    {item.raceCount}
                  </Text>

                  <Text style={[styles.colRankTh, styles.cellNum, { color: f1 > 0 ? text : textMuted, fontWeight: f1 > 0 ? '700' : '400' }]}>
                    {item.first}
                  </Text>
                  <Text style={[styles.colRankTh, styles.cellNum, { color: f2 > 0 ? text : textMuted, fontWeight: f2 > 0 ? '600' : '400' }]}>
                    {item.second}
                  </Text>
                  <Text style={[styles.colRankTh, styles.cellNum, { color: f3 > 0 ? text : textMuted, fontWeight: f3 > 0 ? '600' : '400' }]}>
                    {item.third}
                  </Text>
                  <Text style={[styles.colRankTh, styles.cellNum, { color: f4 > 0 ? text : textMuted }]}>
                    {item.fourth}
                  </Text>
                  <Text style={[styles.colRankTh, styles.cellNum, { color: f5 > 0 ? text : textMuted }]}>
                    {item.fifth}
                  </Text>

                  <Text
                    style={[
                      styles.colEarning,
                      styles.earningText,
                      { color: text },
                      isTotal && styles.boldText,
                    ]}
                  >
                    {formattedEarning}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          /* Mobile Card List */
          <View style={styles.mobileList}>
            {list.map((item, idx) => {
              const label = normalizeSurfaceLabel(item.yearLabel);
              const isTotal = item.yearLabel.toUpperCase().includes('TOPLAM');
              const formattedEarning = formatTjkEarning(item.earning);

              return (
                <View
                  key={`${item.yearLabel}-${idx}`}
                  style={[
                    styles.mobileCard,
                    { backgroundColor: surface, borderColor: border },
                    isTotal && { borderColor: textSecondary },
                  ]}
                >
                  <View style={styles.mobileCardHeader}>
                    <Text style={[styles.mobileSurfaceText, { color: text }, isTotal && styles.boldText]}>
                      {label}
                    </Text>
                    <Text style={[styles.mobileEarning, { color: text }, isTotal && styles.boldText]}>
                      {formattedEarning}
                    </Text>
                  </View>

                  <View style={[styles.mobileStatsRow, { borderTopColor: border }]}>
                    <View style={styles.mobileStatItem}>
                      <Text style={[styles.mobileStatLabel, { color: textMuted }]}>Koşu</Text>
                      <Text style={[styles.mobileStatVal, { color: text }]}>{item.raceCount}</Text>
                    </View>
                    <View style={styles.mobileStatItem}>
                      <Text style={[styles.mobileStatLabel, { color: textMuted }]}>1.</Text>
                      <Text style={[styles.mobileStatVal, { color: text, fontWeight: '700' }]}>{item.first}</Text>
                    </View>
                    <View style={styles.mobileStatItem}>
                      <Text style={[styles.mobileStatLabel, { color: textMuted }]}>2.</Text>
                      <Text style={[styles.mobileStatVal, { color: text }]}>{item.second}</Text>
                    </View>
                    <View style={styles.mobileStatItem}>
                      <Text style={[styles.mobileStatLabel, { color: textMuted }]}>3.</Text>
                      <Text style={[styles.mobileStatVal, { color: text }]}>{item.third}</Text>
                    </View>
                    <View style={styles.mobileStatItem}>
                      <Text style={[styles.mobileStatLabel, { color: textMuted }]}>4.</Text>
                      <Text style={[styles.mobileStatVal, { color: text }]}>{item.fourth}</Text>
                    </View>
                    <View style={styles.mobileStatItem}>
                      <Text style={[styles.mobileStatLabel, { color: textMuted }]}>5.</Text>
                      <Text style={[styles.mobileStatVal, { color: text }]}>{item.fifth}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tableCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      },
      default: {},
    }),
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  totalRow: {
    paddingVertical: 13,
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  colLabel: {
    flex: 2,
  },
  surfaceText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  totalSurfaceText: {
    fontWeight: '700',
  },
  colRaces: {
    width: 60,
    textAlign: 'center',
  },
  colRankTh: {
    width: 44,
    textAlign: 'center',
  },
  cellNum: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  colEarning: {
    flex: 1.8,
    textAlign: 'right',
  },
  boldText: {
    fontWeight: '700',
  },
  earningText: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  mobileList: {
    gap: 10,
  },
  mobileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileSurfaceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mobileEarning: {
    fontSize: 14,
    fontWeight: '600',
  },
  mobileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  mobileStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  mobileStatLabel: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  mobileStatVal: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptyWrap: {
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13.5,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 20,
  },
});
