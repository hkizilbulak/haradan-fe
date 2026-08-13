import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@/utils/formatMoney';
import type { ListingPackage, ListingPackageCode } from '@/types/listing';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostPackagesStepProps = {
  packages: ListingPackage[];
  selected: ListingPackageCode | null;
  error?: string | null;
  onSelect: (code: ListingPackageCode) => void;
};

export function PostPackagesStep({
  packages,
  selected,
  error,
  onSelect,
}: PostPackagesStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const success = useThemeColor('success');
  const successLight = useThemeColor('successLight');
  const errorColor = useThemeColor('error');

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 3 · Paket</Text>
        <Text style={[styles.title, { color: text }]}>Yayın paketi</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          İçerik ve fiyat aynı kalır. Seçiminiz yeşil çerçeve ile işaretlenir.
        </Text>
      </View>
      {error ? (
        <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
      ) : null}
      <View style={styles.grid}>
        {packages.map((pkg) => {
          const on = selected === pkg.code;
          return (
            <Pressable
              key={pkg.code}
              onPress={() => onSelect(pkg.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: on ? successLight : surface,
                  borderColor: on ? success : border,
                  borderWidth: on ? 2 : 1,
                  opacity: pressed ? 0.96 : 1,
                  ...Platform.select({
                    web: {
                      boxShadow: on
                        ? '0 12px 32px rgba(66, 214, 151, 0.16)'
                        : '0 8px 24px rgba(15, 23, 42, 0.04)',
                      cursor: 'pointer' as const,
                    },
                    default: {},
                  }),
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: text }]}>{pkg.name}</Text>
                  {pkg.highlighted ? (
                    <View style={[styles.badge, { borderColor: border }]}>
                      <Text style={[styles.badgeText, { color: secondary }]}>
                        Önerilen
                      </Text>
                    </View>
                  ) : null}
                </View>
                {on ? (
                  <Ionicons name="checkmark-circle" size={22} color={success} />
                ) : (
                  <View style={[styles.radio, { borderColor: border }]} />
                )}
              </View>
              <Text style={[styles.tag, { color: secondary }]}>{pkg.tagline}</Text>
              <View style={styles.features}>
                {pkg.features.map((f) => (
                  <View key={f.id} style={styles.feature}>
                    <Ionicons
                      name={
                        f.included
                          ? (f.icon as keyof typeof Ionicons.glyphMap)
                          : 'close-outline'
                      }
                      size={16}
                      color={f.included ? success : muted}
                    />
                    <Text
                      style={[
                        styles.featureLabel,
                        {
                          color: f.included ? text : muted,
                          textDecorationLine: f.included ? 'none' : 'line-through',
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.priceBox, { borderTopColor: border }]}>
                <Text style={[styles.price, { color: text }]}>
                  {formatMoney(pkg.price)}
                </Text>
                <Text style={[styles.period, { color: secondary }]}>
                  {pkg.durationDays} gün
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  intro: { gap: 6 },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2 },
  lead: { ...Typography.body },
  error: { ...Typography.small },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 260,
    borderRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameRow: { flex: 1, gap: 8 },
  name: { ...Typography.h3 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  tag: { ...Typography.small },
  features: { gap: 8, marginTop: Spacing.sm },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureLabel: { ...Typography.small, flex: 1 },
  priceBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  price: { ...Typography.h2 },
  period: { ...Typography.caption, fontWeight: '600' },
});
