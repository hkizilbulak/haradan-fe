import React, { memo } from 'react';
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
import { formatMoney } from '@/utils/formatMoney';
import type { AdvertSpecGroup, HorseProfile } from '@/types';

type AdvertSpecsProps = {
  groups: AdvertSpecGroup[];
  horse: HorseProfile;
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
  horse,
}: AdvertSpecsProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');

  const identity: SoftRow[] = [
    { icon: 'ribbon-outline', label: 'İsim', value: horse.registeredName },
    {
      icon: 'calendar-outline',
      label: 'Yaş / doğum',
      value: `${horse.age} yaş`,
      hint: horse.birthDate,
    },
    { icon: 'male-female-outline', label: 'Cinsiyet', value: horse.gender },
    { icon: 'color-palette-outline', label: 'Don', value: horse.coatColor },
    { icon: 'leaf-outline', label: 'Cins', value: horse.breed },
    ...(horse.heightCm
      ? [
          {
            icon: 'resize-outline' as const,
            label: 'Cidago',
            value: `${horse.heightCm} cm`,
          },
        ]
      : []),
  ];

  const pedigree: SoftRow[] = [
    { icon: 'git-branch-outline', label: 'Baba', value: horse.sire },
    { icon: 'git-branch-outline', label: 'Anne', value: horse.dam },
    { icon: 'git-network-outline', label: 'Kısrak babası', value: horse.damsire },
  ];

  const people: SoftRow[] = [
    {
      icon: 'person-outline',
      label: 'Sahip',
      value: horse.owners.join(', '),
    },
    { icon: 'home-outline', label: 'Yetiştirici', value: horse.breeder },
    { icon: 'fitness-outline', label: 'Antrenör', value: horse.trainer },
  ];

  const performance: SoftRow[] = [
    {
      icon: 'trophy-outline',
      label: 'Kariyer',
      value: `${horse.career.starts} start · ${horse.career.first}-${horse.career.second}-${horse.career.third}-${horse.career.fourth}-${horse.career.fifth}`,
    },
    {
      icon: 'cash-outline',
      label: 'Toplam kazanç',
      value: formatMoney(horse.careerEarnings),
    },
    {
      icon: 'speedometer-outline',
      label: 'Handikap',
      value: String(horse.handicap),
    },
    ...horse.yearly.map((y) => ({
      icon: 'stats-chart-outline' as const,
      label: String(y.year),
      value: `${y.stats.starts} start · ${y.stats.first}-${y.stats.second}-${y.stats.third}-${y.stats.fourth}-${y.stats.fifth}`,
      hint: formatMoney(y.earnings),
    })),
  ];

  const formRows: SoftRow[] = [
    {
      icon: 'flash-outline',
      label: 'Galibiyet oranı',
      value:
        horse.career.starts > 0
          ? `%${Math.round((horse.career.first / horse.career.starts) * 100)}`
          : '—',
    },
    {
      icon: 'podium-outline',
      label: 'İlk üç',
      value: `${horse.career.first + horse.career.second + horse.career.third} / ${horse.career.starts}`,
    },
    {
      icon: 'cash-outline',
      label: 'Kariyer kazancı',
      value: formatMoney(horse.careerEarnings),
    },
  ];

  const offspringRows: SoftRow[] =
    horse.offspring?.map((o) => ({
      icon: 'paw-outline' as const,
      label: String(o.birthYear),
      value: o.name,
      hint: `${o.performanceSummary}${o.earnings ? ` · ${formatMoney(o.earnings)}` : ''}`,
    })) ?? [];

  const row1: SoftSection[] = [
    { id: 'identity', title: 'Kimlik ve fiziksel', rows: identity },
    { id: 'pedigree', title: 'Orijin (soy ağacı)', rows: pedigree },
    { id: 'people', title: 'İlgili kişiler', rows: people },
  ];

  const row2: SoftSection[] = [
    { id: 'performance', title: 'Performans ve kazanç', rows: performance },
    {
      id: 'form',
      title: horse.offspring?.length ? 'Üreme ve taylar' : 'Form notu',
      rows: horse.offspring?.length ? offspringRows : formRows,
    },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.pageTitle, { color: text }]}>Genel bilgiler</Text>

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
