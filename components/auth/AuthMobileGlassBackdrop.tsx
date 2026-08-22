import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AUTH_HERO_IMAGE } from './AuthHeroPanel';

/** Full-screen hero backdrop for centered glass auth. */
export function AuthMobileGlassBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <Image source={AUTH_HERO_IMAGE} style={styles.image} contentFit="cover" />
      <View style={styles.scrim} />
      <View style={styles.vignette} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,14,0.42)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Soft edge darkening via layered opacity (RN has no radial-gradient)
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 80,
  },
});
