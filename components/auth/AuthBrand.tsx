import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandMark } from '@/components/layout/BrandMark';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type AuthBrandProps = {
  brandName?: string;
  href?: string;
};

export function AuthBrand({
  brandName = 'Haradan.com',
  href = '/',
}: AuthBrandProps) {
  const router = useRouter();
  const { tokens, variant } = useAuthTheme();
  const markVariant = variant === 'dark' ? 'light' : 'dark';

  return (
    <Pressable
      onPress={() => router.replace('/')}
      accessibilityRole="link"
      accessibilityLabel={`${brandName} ana sayfa`}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.8 } : null]}
    >
      <BrandMark variant={markVariant} height={34} />
      <Text style={[styles.name, { color: tokens.text }]}>{brandName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  name: {
    ...Typography.h5,
    fontWeight: '700',
    fontSize: 18,
  },
});
