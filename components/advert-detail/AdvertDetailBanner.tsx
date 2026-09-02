import React, { memo } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ActiveBannerItem } from '@/types';

type AdvertDetailBannerProps = {
  banner?: ActiveBannerItem | null;
  onPress?: (banner: ActiveBannerItem) => void;
};

/**
 * İlan Detay sayfasında 16:9 formatında gösterilen tanıtım/reklam bannerı.
 */
export const AdvertDetailBanner = memo(function AdvertDetailBanner({
  banner,
  onPress,
}: AdvertDetailBannerProps) {
  const router = useRouter();
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

  const content = (
    <View
      style={[
        styles.container,
        {
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
        accessibilityLabel={banner.altText ?? banner.title ?? 'İlan Detay Bannerı'}
      />
    </View>
  );

  if (!isClickable) {
    return (
      <View
        style={styles.wrapper}
        accessibilityRole="image"
        accessibilityLabel={banner.altText ?? banner.title ?? 'İlan Detay Bannerı'}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={banner.altText ?? banner.title ?? 'İlan Detay Bannerı'}
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
