import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/layout/BrandMark';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthLayout } from './AuthLayoutContext';
import { useAuthTheme } from './AuthThemeContext';

type AuthFormHeaderProps = {
  title: string;
  subtitle?: React.ReactNode;
  showBrand?: boolean;
};

export function AuthFormHeader({
  title,
  subtitle,
  showBrand = false,
}: AuthFormHeaderProps) {
  const { tokens } = useAuthTheme();
  const { isGlass } = useAuthLayout();
  const centered = isGlass;

  return (
    <View style={[styles.wrap, centered && styles.wrapCenter]}>
      {showBrand || isGlass ? (
        <View style={[styles.brandRow, centered && styles.brandCenter]}>
          <BrandMark variant="dark" height={isGlass ? 28 : 32} />
        </View>
      ) : null}
      <Text
        style={[
          styles.title,
          isGlass && styles.titleGlass,
          { color: tokens.text },
          centered && styles.titleCenter,
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle && !isGlass ? (
        <View style={[styles.subWrap, centered && styles.subCenter]}>
          {subtitle}
        </View>
      ) : null}
      {isGlass ? (
        <Text style={[styles.glassLead, { color: tokens.textMuted }]}>
          İlanlarınızı yönetmek için giriş yapın
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  wrapCenter: {
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  brandRow: {
    marginBottom: Spacing.xs,
  },
  brandCenter: {
    alignSelf: 'center',
  },
  title: {
    ...Typography.h2,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleGlass: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleCenter: {
    textAlign: 'center',
  },
  subWrap: {
    marginTop: -2,
  },
  subCenter: {
    alignItems: 'center',
  },
  glassLead: {
    ...Typography.small,
    textAlign: 'center',
    marginTop: 2,
  },
});
