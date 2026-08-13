import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const MARK_LIGHT = require('../../assets/brand/haradan-mark.png');
const MARK_DARK = require('../../assets/brand/haradan-mark-dark.png');

const ASPECT = 150 / 72;

type BrandMarkProps = {
  /** light = beyaz siluet (koyu zemin), dark = siyah siluet (açık zemin) */
  variant?: 'light' | 'dark';
  height?: number;
};

export function BrandMark({ variant = 'light', height = 32 }: BrandMarkProps) {
  const width = Math.round(height * ASPECT);

  return (
    <View style={[styles.wrap, { width, height }]} accessibilityElementsHidden>
      <Image
        source={variant === 'light' ? MARK_LIGHT : MARK_DARK}
        style={{ width, height }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
