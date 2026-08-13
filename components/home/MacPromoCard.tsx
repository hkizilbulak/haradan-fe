import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { MacPromo } from '@/types';

type MacPromoCardProps = {
  promo: MacPromo;
  onPress?: () => void;
  height?: number;
};

/** New arrivals sol MacBook promo kartı. */
export function MacPromoCard({ promo, onPress, height = 420 }: MacPromoCardProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const primary = useThemeColor('primary');
  const header = useThemeColor('header');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${promo.title}. ${promo.subtitle}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: header,
          height: isWide ? height : 280,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      {promo.backgroundUrl ? (
        <Image
          source={promo.backgroundUrl}
          style={styles.bg}
          contentFit="cover"
          transition={200}
        />
      ) : null}
      <View style={styles.overlay} />
      <Image
        source={promo.imageUrl}
        style={[styles.product, { backgroundColor: 'transparent' }]}
        contentFit="contain"
        transition={200}
      />
      <View style={styles.copy}>
        <Text style={styles.title}>{promo.title}</Text>
        <Text style={styles.subtitle}>{promo.subtitle}</Text>
        <View style={[styles.cta, { backgroundColor: primary }]}>
          <Text style={styles.ctaText}>{promo.ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,24,35,0.35)',
  },
  product: {
    position: 'absolute',
    right: -10,
    top: 24,
    width: '78%',
    height: '62%',
  },
  copy: {
    padding: Spacing.lg,
    gap: 6,
    zIndex: 2,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
