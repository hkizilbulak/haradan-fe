import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { SalePromo } from '@/types';

type SaleBannerProps = {
  promo: SalePromo;
  onPress?: () => void;
};

/** Cartzilla Seasonal weekly sale — %20 OFF + kupon kodu. */
export const SaleBanner = memo(function SaleBanner({ promo, onPress }: SaleBannerProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const hero = useThemeColor('hero');
  const text = useThemeColor('text');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const skeleton = useThemeColor('skeleton');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={promo.title}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: hero,
          opacity: pressed ? 0.97 : 1,
          flexDirection: isWide ? 'row' : 'column',
        },
      ]}
    >
      <View style={[styles.left, !isWide && styles.leftMobile]}>
        <Text style={[styles.discount, { color: text }]}>{promo.discountLabel}</Text>
        <View style={[styles.dash, { borderColor: border }]} />
        <View style={styles.copy}>
          <Text style={[styles.title, { color: text }]}>{promo.title}</Text>
          <View style={styles.codeRow}>
            <Text style={[styles.useCode, { color: text }]}>Kod: </Text>
            <View style={[styles.codePill, { backgroundColor: surface }]}>
              <Text style={[styles.code, { color: text }]}>{promo.code}</Text>
            </View>
            <Text style={[styles.useCode, { color: text }]}> ile avantajlı aşım</Text>
          </View>
        </View>
      </View>
      <Image
        source={promo.imageUrl}
        style={[
          styles.image,
          { backgroundColor: skeleton },
          !isWide && styles.imageMobile,
        ]}
        contentFit="cover"
        transition={200}
        priority="low"
        cachePolicy="memory-disk"
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    minHeight: 160,
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  copy: { flex: 1, gap: 8 },
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
  useCode: { fontSize: 14 },
  codePill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  code: { fontSize: 13, fontWeight: '700' },
  image: {
    width: 220,
    height: 140,
  },
  imageMobile: {
    width: '100%',
    height: 120,
  },
});
