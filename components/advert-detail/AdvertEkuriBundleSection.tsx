import React, { memo, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { advertRepository } from '@/services/advert';
import { formatMoney } from '@/utils/formatMoney';
import type { AdvertId } from '@/types/advertId';
import type { PublishedAdvertCard } from '@/types';

type AdvertEkuriBundleSectionProps = {
  bundleId: string;
  currentAdvertId: AdvertId;
  onPress?: (id: AdvertId) => void;
};

export const AdvertEkuriBundleSection = memo(function AdvertEkuriBundleSection({
  bundleId,
  currentAdvertId,
  onPress,
}: AdvertEkuriBundleSectionProps) {
  const router = useRouter();
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  const [items, setItems] = useState<PublishedAdvertCard[]>([]);
  const [loading, setLoading] = useState(true);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const cardBg = useThemeColor('surface');

  useEffect(() => {
    let cancelled = false;
    if (!bundleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void advertRepository
      .getBundleAdverts(bundleId)
      .then((res) => {
        if (cancelled) return;
        const currentStr = String(currentAdvertId);
        const filtered = (res ?? []).filter((it) => String(it.id) !== currentStr);
        setItems(filtered);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bundleId, currentAdvertId]);

  if (loading || items.length === 0) {
    return null;
  }

  const handleCardPress = (id: AdvertId) => {
    if (onPress) {
      onPress(id);
    } else {
      router.push(`/advert/${id}`);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${primary}15` }]}>
            <Ionicons name="ribbon-outline" size={20} color={primary} />
          </View>
          <View>
            <View style={styles.titleWithBadge}>
              <Text style={[styles.title, { color: text }]}>
                Bu Ekürinin Diğer Satılık Atları
              </Text>
              <View style={[styles.badge, { backgroundColor: primary }]}>
                <Text style={styles.badgeText}>{items.length} At</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              Aynı eküriye ait satışta olan diğer atlar
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const coverUrl = item.cover?.publicUrl;
          const loc = item.provinceName || item.locationName || '';
          return (
            <Pressable
              key={item.id}
              onPress={() => handleCardPress(item.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: border,
                  backgroundColor: cardBg,
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  ...Platform.select({
                    web: {
                      cursor: 'pointer' as const,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    },
                    default: {},
                  }),
                },
              ]}
            >
              <View style={styles.imageWrap}>
                {coverUrl ? (
                  <Image
                    source={{ uri: coverUrl }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.noImage, { backgroundColor: border }]}>
                    <Ionicons name="image-outline" size={32} color={textMuted} />
                  </View>
                )}
                <View style={styles.ekuriPill}>
                  <Text style={styles.ekuriPillText}>Eküri</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text
                  style={[styles.itemTitle, { color: text }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <View style={styles.metaRow}>
                  {loc ? (
                    <View style={styles.locWrap}>
                      <Ionicons name="location-outline" size={13} color={textMuted} />
                      <Text style={[styles.locText, { color: textMuted }]} numberOfLines={1}>
                        {loc}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.priceText, { color: primary }]}>
                  {item.price ? formatMoney(item.price) : 'Fiyat Belirtilmedi'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    marginVertical: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h4,
    fontWeight: '700',
    fontSize: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#00000010',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekuriPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ekuriPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: Spacing.sm,
  },
  itemTitle: {
    ...Typography.small,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    minHeight: 36,
  },
  metaRow: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  locWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 12,
  },
  priceText: {
    ...Typography.h5,
    fontWeight: '700',
    fontSize: 15,
  },
});
