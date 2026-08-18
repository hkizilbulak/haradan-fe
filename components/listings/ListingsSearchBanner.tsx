import React, { memo } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ActiveBannerItem } from '@/types';

type ListingsSearchBannerProps = {
  banner?: ActiveBannerItem | null;
  onPress?: (banner: ActiveBannerItem) => void;
};

const BANNER_HEIGHT_DESKTOP = 120;
const BANNER_HEIGHT_MOBILE = 75;

/**
 * Arama / İlanlar listeleme sayfasında 3:1 kompakt formatında gösterilen sponsorlu arama bannerı.
 */
export const ListingsSearchBanner = memo(function ListingsSearchBanner({
  banner,
  onPress,
}: ListingsSearchBannerProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  const skeleton = useThemeColor('skeleton');
  const border = useThemeColor('border');

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
  const bannerHeight = isWide ? BANNER_HEIGHT_DESKTOP : BANNER_HEIGHT_MOBILE;

  const content = (
    <View
      style={[
        styles.container,
        {
          height: bannerHeight,
          backgroundColor: skeleton,
          borderColor: border,
        },
      ]}
    >
      <Image
        source={banner.imageUrl}
        style={styles.image}
        contentFit="cover"
        transition={250}
        priority="high"
        cachePolicy="memory-disk"
        accessibilityLabel={banner.altText ?? banner.title ?? 'Arama Bannerı'}
      />
    </View>
  );

  if (!isClickable) {
    return (
      <View
        style={styles.wrapper}
        accessibilityRole="image"
        accessibilityLabel={banner.altText ?? banner.title ?? 'Arama Bannerı'}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={banner.altText ?? banner.title ?? 'Arama Bannerı'}
      style={({ pressed }) => [
        styles.wrapper,
        {
          opacity: pressed ? 0.96 : 1,
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
    marginVertical: Spacing.md,
  },
  container: {
    width: '100%',
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
