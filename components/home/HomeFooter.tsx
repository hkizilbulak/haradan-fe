import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

export function HomeFooter() {
  const border = useThemeColor('border');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const primary = useThemeColor('primary');

  return (
    <View
      style={[styles.wrap, { borderTopColor: border }]}
      accessibilityRole="summary"
    >
      <Text style={[styles.brand, { color: primary }]}>Haradan.com</Text>
      <Text style={[styles.tagline, { color: textSecondary }]}>
        Satılık atlar, at hizmetleri ve aşım ilanları.
      </Text>
      <Text style={[styles.copy, { color: textMuted }]}>
        © {new Date().getFullYear()} Haradan.com. Tüm hakları saklıdır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  brand: {
    ...Typography.h5,
    fontWeight: '700',
  },
  tagline: {
    ...Typography.small,
  },
  copy: {
    ...Typography.caption,
  },
});
