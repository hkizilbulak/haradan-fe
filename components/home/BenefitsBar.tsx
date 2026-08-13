import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type Benefit = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: 'car-outline',
    title: 'Free Shipping & Returns',
    subtitle: 'For all orders over $199.00',
  },
  {
    icon: 'card-outline',
    title: 'Secure Payment',
    subtitle: 'We ensure secure payment',
  },
  {
    icon: 'refresh-outline',
    title: 'Money Back Guarantee',
    subtitle: 'Returning money 30 days',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: '24/7 Customer Support',
    subtitle: 'Friendly customer support',
  },
];

/**
 * Cartzilla 4'lü güven şeridi — dairesel ikon + başlık + alt metin.
 */
export function BenefitsBar() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const textMuted = useThemeColor('textMuted');

  return (
    <View
      style={[styles.wrap, !isWide && styles.wrapMobile]}
      accessibilityRole="summary"
      accessibilityLabel="Store benefits"
    >
      {BENEFITS.map((item, index) => (
        <View
          key={item.title}
          style={[
            styles.item,
            isWide && styles.itemWide,
            isWide && index < BENEFITS.length - 1
              ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: border }
              : null,
            !isWide && styles.itemMobile,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: border }]}>
            <Ionicons name={item.icon} size={20} color={textMuted} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.subtitle, { color: textSecondary }]} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  wrapMobile: {
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  itemWide: {
    flex: 1,
  },
  itemMobile: {
    width: '47%',
    flexGrow: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.small,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
  },
});
