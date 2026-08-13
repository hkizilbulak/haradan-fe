import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PromoBannerProps = {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  imageUrl: string;
  onPress?: () => void;
};

export function PromoBanner({
  title,
  subtitle,
  ctaLabel = 'Hemen başla',
  imageUrl,
  onPress,
}: PromoBannerProps) {
  const primary = useThemeColor('primary');
  const skeleton = useThemeColor('skeleton');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.wrap,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <Image
        source={imageUrl}
        style={[styles.image, { backgroundColor: skeleton }]}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={[styles.cta, { backgroundColor: primary }]}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    height: 148,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(26, 22, 18, 0.45)',
    gap: 6,
  },
  title: {
    ...Typography.h3,
    color: '#fff',
  },
  subtitle: {
    ...Typography.small,
    color: '#ffffffdd',
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ctaText: {
    ...Typography.small,
    fontWeight: '700',
    color: '#fff',
  },
});
