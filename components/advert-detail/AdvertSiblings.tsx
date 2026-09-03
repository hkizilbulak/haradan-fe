import React, { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { HorseSibling } from '@/types';
import { openTjkHorseSearch } from './AdvertSpecs';

type AdvertSiblingsProps = {
  siblings?: HorseSibling[];
  damName?: string;
};

function formatTjkEarning(raw: string | null | undefined): string {
  if (!raw) return '0 ₺';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/\s*(ton|t|tl|try|₺)$/i, '').trim();
  if (!cleaned || cleaned === '0') return '0 ₺';
  return `${cleaned} ₺`;
}

export const AdvertSiblings = memo(function AdvertSiblings({
  siblings,
  damName,
}: AdvertSiblingsProps) {
  const isWide = useIsWideLayout();

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const list = siblings ?? [];

  const summary = useMemo(() => {
    let totalRaces = 0;
    let totalWins = 0;
    let totalPlacements = 0;
    list.forEach((s) => {
      totalRaces += parseInt(s.raceCount || '0', 10) || 0;
      const f1 = parseInt(s.first || '0', 10) || 0;
      const f2 = parseInt(s.second || '0', 10) || 0;
      const f3 = parseInt(s.third || '0', 10) || 0;
      const f4 = parseInt(s.fourth || '0', 10) || 0;
      totalWins += f1;
      totalPlacements += f1 + f2 + f3 + f4;
    });
    const winRate = totalRaces > 0 ? `%${Math.round((totalWins / totalRaces) * 100)}` : '%0';
    const placementRate = totalRaces > 0 ? `%${Math.round((totalPlacements / totalRaces) * 100)}` : '%0';
    return {
      count: list.length,
      totalRaces,
      totalWins,
      totalPlacements,
      winRate,
      placementRate,
    };
  }, [list]);

  if (list.length === 0) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: surface, borderColor: border }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: `${textSecondary}15` }]}>
          <Ionicons name="people-outline" size={32} color={textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: text }]}>
          Kayıtlı Anne Kardeşi Bulunamadı
        </Text>
        <Text style={[styles.emptyDesc, { color: textSecondary }]}>
          Bu safkanın TJK sisteminde kayıtlı anne kardeşi (koşan kardeş) bilgisi bulunmamaktadır.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {/* Summary KPI Chips */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.chipLabel, { color: textSecondary }]}>Kardeş Sayısı</Text>
          <Text style={[styles.chipValue, { color: text }]}>{summary.count}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.chipLabel, { color: textSecondary }]}>Toplam Koşu</Text>
          <Text style={[styles.chipValue, { color: text }]}>{summary.totalRaces}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.chipLabel, { color: textSecondary }]}>Kazanılan Yarış</Text>
          <Text style={[styles.chipValue, { color: text }]}>
            {summary.totalWins} ({summary.winRate})
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.chipLabel, { color: textSecondary }]}>Toplam Derece</Text>
          <Text style={[styles.chipValue, { color: text }]}>
            {summary.totalPlacements} ({summary.placementRate})
          </Text>
        </View>
      </View>

      {/* Main Table */}
      {isWide ? (
        <View style={[styles.tableCard, { backgroundColor: surface, borderColor: border }]}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow, { borderBottomColor: border }]}>
            <Text style={[styles.th, styles.colName, { color: textSecondary }]}>SAFKAN ADI</Text>
            <Text style={[styles.th, styles.colFather, { color: textSecondary }]}>BABA ADI</Text>
            <Text style={[styles.th, styles.colRaces, { color: textSecondary }]}>KOŞU</Text>
            <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>1.</Text>
            <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>2.</Text>
            <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>3.</Text>
            <Text style={[styles.th, styles.colRankTh, { color: textSecondary }]}>4.</Text>
            <Text style={[styles.th, styles.colEarning, { color: textSecondary }]}>TOPLAM KAZANÇ</Text>
          </View>

          {/* Table Rows */}
          {list.map((sibling, idx) => {
            const parseNum = (v: string) => parseInt(v || '0', 10) || 0;
            const f1 = parseNum(sibling.first);
            const f2 = parseNum(sibling.second);
            const f3 = parseNum(sibling.third);
            const f4 = parseNum(sibling.fourth);

            return (
              <View
                key={`${sibling.name}-${idx}`}
                style={[
                  styles.tableRow,
                  idx !== list.length - 1 && { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Pressable
                  onPress={() => openTjkHorseSearch(sibling.name)}
                  style={({ pressed }) => [styles.colName, styles.nameContainer, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.nameText, { color: text }]} numberOfLines={1}>
                    {sibling.name}
                  </Text>
                  <Ionicons name="open-outline" size={12} color={textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => sibling.fatherName && openTjkHorseSearch(sibling.fatherName)}
                  disabled={!sibling.fatherName || sibling.fatherName === '-'}
                  style={({ pressed }) => [styles.colFather, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.fatherText, { color: textSecondary }]} numberOfLines={1}>
                    {sibling.fatherName || '-'}
                  </Text>
                </Pressable>

                <Text style={[styles.colRaces, styles.cellNum, { color: text }]}>
                  {sibling.raceCount}
                </Text>

                <Text style={[styles.colRankTh, styles.cellNum, { color: f1 > 0 ? text : textMuted, fontWeight: f1 > 0 ? '700' : '400' }]}>
                  {sibling.first}
                </Text>
                <Text style={[styles.colRankTh, styles.cellNum, { color: f2 > 0 ? text : textMuted, fontWeight: f2 > 0 ? '600' : '400' }]}>
                  {sibling.second}
                </Text>
                <Text style={[styles.colRankTh, styles.cellNum, { color: f3 > 0 ? text : textMuted, fontWeight: f3 > 0 ? '600' : '400' }]}>
                  {sibling.third}
                </Text>
                <Text style={[styles.colRankTh, styles.cellNum, { color: f4 > 0 ? text : textMuted }]}>
                  {sibling.fourth}
                </Text>

                <Text style={[styles.colEarning, styles.earningText, { color: text }]}>
                  {formatTjkEarning(sibling.earning)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        /* Mobile Card List */
        <View style={styles.mobileList}>
          {list.map((sibling, idx) => (
            <View
              key={`${sibling.name}-${idx}`}
              style={[styles.mobileCard, { backgroundColor: surface, borderColor: border }]}
            >
              <View style={styles.mobileCardHeader}>
                <Pressable
                  onPress={() => openTjkHorseSearch(sibling.name)}
                  style={({ pressed }) => [styles.nameContainer, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.mobileName, { color: text }]}>
                    {sibling.name}
                  </Text>
                  <Ionicons name="open-outline" size={12} color={textMuted} />
                </Pressable>
                <Text style={[styles.mobileEarning, { color: text }]}>
                  {formatTjkEarning(sibling.earning)}
                </Text>
              </View>

              <Pressable
                onPress={() => sibling.fatherName && openTjkHorseSearch(sibling.fatherName)}
                disabled={!sibling.fatherName || sibling.fatherName === '-'}
                style={({ pressed }) => [styles.mobileFatherRow, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.mobileFatherLabel, { color: textSecondary }]}>
                  Baba:
                </Text>
                <Text style={[styles.mobileFatherVal, { color: text }]}>
                  {sibling.fatherName || '-'}
                </Text>
              </Pressable>

              <View style={[styles.mobileStatsRow, { borderTopColor: border }]}>
                <View style={styles.mobileStatItem}>
                  <Text style={[styles.mobileStatLabel, { color: textMuted }]}>Koşu</Text>
                  <Text style={[styles.mobileStatVal, { color: text }]}>{sibling.raceCount}</Text>
                </View>
                <View style={styles.mobileStatItem}>
                  <Text style={[styles.mobileStatLabel, { color: textMuted }]}>1.</Text>
                  <Text style={[styles.mobileStatVal, { color: text, fontWeight: '700' }]}>{sibling.first}</Text>
                </View>
                <View style={styles.mobileStatItem}>
                  <Text style={[styles.mobileStatLabel, { color: textMuted }]}>2.</Text>
                  <Text style={[styles.mobileStatVal, { color: text }]}>{sibling.second}</Text>
                </View>
                <View style={styles.mobileStatItem}>
                  <Text style={[styles.mobileStatLabel, { color: textMuted }]}>3.</Text>
                  <Text style={[styles.mobileStatVal, { color: text }]}>{sibling.third}</Text>
                </View>
                <View style={styles.mobileStatItem}>
                  <Text style={[styles.mobileStatLabel, { color: textMuted }]}>4.</Text>
                  <Text style={[styles.mobileStatVal, { color: text }]}>{sibling.fourth}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  chip: {
    flex: 1,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipValue: {
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
  colName: {
    flex: 2.2,
  },
  colFather: {
    flex: 2,
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  fatherText: {
    fontSize: 13,
    fontWeight: '400',
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
  mobileName: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  mobileEarning: {
    fontSize: 14,
    fontWeight: '600',
  },
  mobileFatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileFatherLabel: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  mobileFatherVal: {
    fontSize: 12.5,
    fontWeight: '500',
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
