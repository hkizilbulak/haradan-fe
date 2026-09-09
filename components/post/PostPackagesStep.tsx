import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@/utils/formatMoney';
import type { ListingDraft, ListingPackage, ListingPackageCode } from '@/types/listing';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PackagePreviewModal } from './PackagePreviewModal';

type PostPackagesStepProps = {
  packages: ListingPackage[];
  selected: ListingPackageCode | null;
  draft?: ListingDraft;
  error?: string | null;
  onSelect: (code: ListingPackageCode) => void;
};

export function PostPackagesStep({
  packages,
  selected,
  draft,
  error,
  onSelect,
}: PostPackagesStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const success = useThemeColor('success');
  const successLight = useThemeColor('successLight');
  const errorColor = useThemeColor('error');
  const [previewPkg, setPreviewPkg] = useState<ListingPackage | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 3 · Paket</Text>
        <Text style={[styles.title, { color: text }]}>Yayın paketini seçin</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          Görünürlük ve süre pakete göre değişir. İstediğinizi işaretleyip devam
          edin.
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
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.nameRow}>
                    <View style={styles.titleWithBadge}>
                      <Text style={[styles.name, { color: text }]}>{pkg.name}</Text>
                      {pkg.highlighted ? (
                        <View style={styles.highlightBadge}>
                          <Ionicons name="sparkles" size={11} color="#f59e0b" />
                          <Text style={styles.highlightBadgeText}>Önerilen</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.tag, { color: secondary }]}>{pkg.tagline}</Text>
                  </View>
                  {on ? (
                    <Ionicons name="checkmark-circle" size={24} color={success} />
                  ) : (
                    <View style={[styles.radio, { borderColor: border }]} />
                  )}
                </View>

                <View style={styles.features}>
                  {pkg.features.map((f) => (
                    <View key={f.id} style={styles.feature}>
                      <Ionicons
                        name={
                          f.included
                            ? (f.icon as keyof typeof Ionicons.glyphMap)
                            : 'close-outline'
                        }
                        size={17}
                        color={f.included ? success : muted}
                        style={{ opacity: f.included ? 1 : 0.6 }}
                      />
                      <Text
                        style={[
                          styles.featureLabel,
                          {
                            color: f.included ? text : muted,
                            opacity: f.included ? 1 : 0.6,
                            textDecorationLine: f.included ? 'none' : 'line-through',
                          },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: border }]}>
                <View style={styles.priceBox}>
                  <Text style={[styles.price, { color: text }]}>
                    {formatMoney(pkg.price)}
                  </Text>
                  <View style={[styles.periodBadge, { backgroundColor: border }]}>
                    <Text style={[styles.period, { color: secondary }]}>
                      {pkg.durationDays} gün
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setPreviewPkg(pkg);
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`${pkg.name} nasıl görünür?`}
                  style={({ pressed }) => [
                    styles.howItLooksBtn,
                    {
                      borderColor: primary,
                      backgroundColor: pressed
                        ? 'rgba(239, 68, 68, 0.16)'
                        : 'rgba(239, 68, 68, 0.08)',
                    },
                  ]}
                >
                  <Ionicons name="eye-outline" size={16} color={primary} />
                  <Text style={[styles.howItLooksText, { color: primary }]}>
                    Nasıl Görünür?
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>
      {draft && previewPkg ? (
        <PackagePreviewModal
          visible={previewPkg !== null}
          pkg={previewPkg}
          draft={draft}
          onClose={() => setPreviewPkg(null)}
          onSelectPackage={(code) => {
            onSelect(code);
            setPreviewPkg(null);
          }}
        />
      ) : null}
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
    alignItems: 'stretch',
  },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 260,
    borderRadius: 20,
    padding: Spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
  },
  nameRow: {
    flex: 1,
    gap: 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    ...Typography.h3,
    fontWeight: '700',
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  highlightBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 2,
  },
  tag: {
    ...Typography.small,
    marginTop: 2,
  },
  features: {
    gap: 10,
    marginTop: Spacing.md,
    flex: 1,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  featureLabel: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  price: {
    ...Typography.h2,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  period: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  howItLooksBtn: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease-in-out',
      },
      default: {},
    }),
  },
  howItLooksText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
