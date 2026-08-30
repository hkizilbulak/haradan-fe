import React, { memo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ActiveBannerItem } from '@/types';

type HomepageAdBannerProps = {
  banner?: ActiveBannerItem | null;
  onPress?: (banner: ActiveBannerItem) => void;
};

/**
 * Haradan Yenilenmiş Kampanya Bannerı:
 * Arka planda yüksek kaliteli görsel ve koyu degrade maske,
 * Parlak camRozet (Badge), okunaklı tipografi ve belirgin Aksiyon (CTA) Butonu.
 */
export const HomepageAdBanner = memo(function HomepageAdBanner({
  banner,
  onPress,
}: HomepageAdBannerProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const skeleton = useThemeColor('skeleton');

  if (!banner || !banner.imageUrl) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress(banner);
      return;
    }
    if (banner.targetUrl) {
      if (/^https?:\/\//i.test(banner.targetUrl)) {
        Linking.openURL(banner.targetUrl).catch(() => {});
      } else {
        router.push(banner.targetUrl as any);
      }
    }
  };

  const isClickable = Boolean(onPress || banner.targetUrl);

  const trimmedAlt = banner.altText?.trim() ?? '';
  const hasPercentage = trimmedAlt.startsWith('%');
  const discountLabel = hasPercentage ? trimmedAlt.split(' ')[0] : null;
  const promoSubtitle = hasPercentage
    ? trimmedAlt.substring(discountLabel!.length).trim()
    : trimmedAlt;

  const badgeText = discountLabel
    ? `${discountLabel} İNDİRİM`
    : promoSubtitle || 'AŞIM SEZONU KAMPANYASI';

  const cardContent = (
    <View style={styles.cardContainer}>
      {/* Background Banner Image */}
      <Image
        source={banner.imageUrl}
        style={[styles.backgroundImage, { backgroundColor: skeleton }]}
        contentFit="cover"
        transition={300}
        priority="high"
        cachePolicy="memory-disk"
        accessibilityLabel={banner.altText ?? banner.title ?? 'Kampanya Reklamı'}
      />

      {/* Dark Gradient Overlay for Maximum Readability */}
      <View style={styles.gradientOverlay} />

      {/* Glossy Inner Border */}
      <View style={styles.borderOverlay} />

      {/* Card Content Overlay */}
      <View style={[styles.contentContainer, isWide && styles.contentContainerWide]}>
        <View style={styles.textStack}>
          {/* Top Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="sparkles" size={13} color="#F43F5E" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{badgeText.toUpperCase()}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {banner.title || 'Aşım Sezonu Kampanyası'}
          </Text>

          {/* Subtitle / Note */}
          <Text style={styles.subtitle} numberOfLines={2}>
            Arap ve İngiliz aygırlar için sezona özel fırsatları kaçırmayın.
          </Text>
        </View>

        {/* CTA Button */}
        <View style={styles.ctaWrapper}>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Fırsatı İncele</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" style={styles.ctaIcon} />
          </View>
        </View>
      </View>
    </View>
  );

  if (!isClickable) {
    return (
      <View
        style={styles.wrapper}
        accessibilityRole="image"
        accessibilityLabel={banner.altText ?? banner.title ?? 'Kampanya Reklamı'}
      >
        {cardContent}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={banner.altText ?? banner.title ?? 'Kampanya Reklamı'}
      style={({ pressed }) => [
        styles.wrapper,
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      {cardContent}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  cardContainer: {
    width: '100%',
    borderRadius: Radius.card || 20,
    overflow: 'hidden',
    minHeight: 180,
    position: 'relative',
    backgroundColor: '#0F172A',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2)',
      },
      default: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
    }),
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: Platform.select({
    web: {
      ...StyleSheet.absoluteFillObject,
      backgroundImage:
        'linear-gradient(95deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.82) 48%, rgba(15, 23, 42, 0.28) 100%)',
    },
    default: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.76)',
    },
  }) as any,
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.card || 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    pointerEvents: 'none',
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg + 4,
    paddingVertical: Spacing.lg,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 180,
    zIndex: 2,
  },
  contentContainerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 160,
    paddingHorizontal: Spacing.xl,
  },
  textStack: {
    flex: 1,
    maxWidth: 520,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  badgeIcon: {
    marginRight: 5,
  },
  badgeText: {
    color: '#F43F5E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(226, 232, 240, 0.88)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  ctaWrapper: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaIcon: {
    marginLeft: 6,
  },
});

