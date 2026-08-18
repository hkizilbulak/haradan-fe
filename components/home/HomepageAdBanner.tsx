import React, { memo } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ActiveBannerItem } from '@/types';

type HomepageAdBannerProps = {
  banner?: ActiveBannerItem | null;
  onPress?: (banner: ActiveBannerItem) => void;
};

/**
 * Haradan orijinal yatay reklam bannerı:
 * Sol tarafta % İndirim/Etiket, kesik dikey çizgi, Başlık ve Kampanya Kodu/Açıklama;
 * Sağ tarafta ise reklam görseli yer alır.
 */
export const HomepageAdBanner = memo(function HomepageAdBanner({
  banner,
  onPress,
}: HomepageAdBannerProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const hero = useThemeColor('hero');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
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

  // Başlık ve etiket ayrıştırma: Yalnızca kullanıcı % ile başlayan bir değer girdiğinde % alanı açılır.
  const trimmedAlt = banner.altText?.trim() ?? '';
  const hasPercentage = trimmedAlt.startsWith('%');
  const discountLabel = hasPercentage ? trimmedAlt.split(' ')[0] : null;
  const promoSubtitle = hasPercentage
    ? trimmedAlt.substring(discountLabel!.length).trim()
    : trimmedAlt;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: hero,
          flexDirection: isWide ? 'row' : 'column',
        },
      ]}
    >
      <View style={[styles.left, !isWide && styles.leftMobile]}>
        {discountLabel && (
          <>
            <Text style={[styles.discount, { color: text }]}>{discountLabel}</Text>
            <View style={[styles.dash, { borderColor: border }]} />
          </>
        )}
        <View style={styles.copy}>
          <Text style={[styles.title, { color: text }]} numberOfLines={2}>
            {banner.title || 'AŞIM SEZONU KAMPANYASI'}
          </Text>
          {promoSubtitle ? (
            <View style={styles.codeRow}>
              <Text style={[styles.useCode, { color: textSecondary }]}>{promoSubtitle}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Image
        source={banner.imageUrl}
        style={[
          styles.image,
          { backgroundColor: skeleton },
          !isWide && styles.imageMobile,
        ]}
        contentFit="cover"
        transition={250}
        priority="high"
        cachePolicy="memory-disk"
        accessibilityLabel={banner.altText ?? banner.title ?? 'Yatay Reklam'}
      />
    </View>
  );

  if (!isClickable) {
    return (
      <View
        style={styles.wrapper}
        accessibilityRole="image"
        accessibilityLabel={banner.altText ?? banner.title ?? 'Yatay Reklam'}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={banner.altText ?? banner.title ?? 'Yatay Reklam'}
      style={({ pressed }) => [
        styles.wrapper,
        {
          opacity: pressed ? 0.97 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    minHeight: 160,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  leftMobile: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  discount: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  dash: {
    width: 1,
    alignSelf: 'stretch',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  codeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  useCode: {
    fontSize: 14,
  },
  codePill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  code: {
    fontSize: 13,
    fontWeight: '700',
  },
  image: {
    width: 220,
    height: 140,
    borderRadius: 10,
  },
  imageMobile: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
});
