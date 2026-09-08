import React, { useCallback, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertId } from '@/types/advertId';
import { formatAdvertId } from '@/types/advertId';
import { copyToClipboard } from '@/utils/copyToClipboard';

export type PostReviewStepProps = {
  advertId: AdvertId | null;
  status: string | null;
  title: string;
  categoryName?: string | null;
  priceTl?: string | null;
  coverUri?: string | null;
  onGoListings: () => void;
  onGoHome: () => void;
  onNewListing?: () => void;
};

export function PostReviewStep({
  advertId,
  status,
  title,
  categoryName,
  priceTl,
  coverUri,
  onGoListings,
  onGoHome,
}: PostReviewStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const success = useThemeColor('success');
  const primary = useThemeColor('primary');
  const [copied, setCopied] = useState(false);

  const displayId = formatAdvertId(advertId);
  const displayTitle = (title || '').trim() || 'İlan';

  const onCopy = useCallback(async () => {
    if (!displayId) return;
    const ok = await copyToClipboard(displayId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayId]);

  return (
    <View style={styles.container}>
      {/* ── 1. Hero / Header (Kompakt & Zarif) ── */}
      <View style={styles.hero}>
        <View style={styles.iconHalo}>
          <View style={[styles.iconCore, { backgroundColor: success }]}>
            <Ionicons name="checkmark" size={26} color="#ffffff" />
          </View>
        </View>

        <Text style={[styles.title, { color: text }]}>
          İlanınız İncelemeye Alındı
        </Text>
        <Text style={[styles.subtitle, { color: secondary }]}>
          İlanınız editör ekibimize ulaştı. Kontroller tamamlandıktan sonra en kısa sürede yayına alınacaktır.
        </Text>
      </View>

      {/* ── 2. Tek Parça Sade ve Estetik İlan Kartı ── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        {/* Üst Kısım: İlan No & Kopyala */}
        {displayId ? (
          <View style={[styles.metaRow, { borderBottomColor: border }]}>
            <View style={styles.metaLeft}>
              <Text style={[styles.metaLabel, { color: muted }]}>İlan no</Text>
              <Text style={[styles.metaValue, { color: text }]} selectable>
                #{displayId}
              </Text>
            </View>
            <Pressable
              onPress={() => void onCopy()}
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Kopyalandı' : 'İlan numarasını kopyala'}
              hitSlop={8}
              style={({ pressed }) => [
                styles.copyBtn,
                {
                  borderColor: copied ? success : border,
                  backgroundColor: copied ? 'rgba(66, 214, 151, 0.12)' : 'rgba(15, 23, 42, 0.04)',
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={15}
                color={copied ? success : muted}
              />
              <Text style={[styles.copyLabel, { color: copied ? success : text }]}>
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Orta Kısım: İlan Bilgileri */}
        <View style={styles.advertContent}>
          <View style={styles.advertRow}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                <Ionicons name="images-outline" size={20} color={primary} />
              </View>
            )}

            <View style={styles.advertDetails}>
              <Text style={[styles.advertTitle, { color: text }]} numberOfLines={1}>
                {displayTitle}
              </Text>
              <View style={styles.tagsRow}>
                {categoryName ? (
                  <Text style={[styles.categoryText, { color: muted }]} numberOfLines={1}>
                    {categoryName}
                  </Text>
                ) : null}
                {categoryName && priceTl ? (
                  <Text style={[styles.dotSep, { color: muted }]}>·</Text>
                ) : null}
                {priceTl ? (
                  <Text style={[styles.priceText, { color: primary }]}>
                    {priceTl} TL
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Durum Satırı (Minimalist) */}
          <View style={[styles.statusRow, { borderColor: border }]}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Editör Onayında</Text>
            </View>
            <Text style={[styles.statusHint, { color: muted }]}>
              Ortalama 1-2 saat içinde onaylanır
            </Text>
          </View>
        </View>
      </View>

      {/* ── 3. Kompakt Yan Yana Butonlar (Sayfa Taşmaz) ── */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onGoHome}
          accessibilityRole="button"
          accessibilityLabel="Ana sayfa"
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: border, backgroundColor: surface },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="home-outline" size={17} color={text} style={styles.btnIcon} />
          <Text style={[styles.secondaryBtnText, { color: text }]}>Ana Sayfa</Text>
        </Pressable>

        <Pressable
          onPress={onGoListings}
          accessibilityRole="button"
          accessibilityLabel="İlanlarıma git"
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Ionicons name="list-outline" size={18} color="#ffffff" style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>İlanlarıma Git</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" style={styles.btnArrow} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 16,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  hero: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  iconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(66, 214, 151, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(66, 214, 151, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(66, 214, 151, 0.35)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  title: {
    ...Typography.h3,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 400,
    paddingHorizontal: Spacing.sm,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  metaLabel: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: Platform.OS === 'web' ? (['tabular-nums'] as const) : undefined,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  advertContent: {
    padding: Spacing.md,
    gap: 12,
  },
  advertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advertDetails: {
    flex: 1,
    gap: 3,
  },
  advertTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
  },
  dotSep: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d97706',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  statusHint: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.18s ease',
      } as any,
      default: {},
    }),
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1.3,
    minHeight: 46,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
      } as any,
      default: {},
    }),
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  btnIcon: {
    marginRight: 6,
  },
  btnArrow: {
    marginLeft: 6,
  },
});
