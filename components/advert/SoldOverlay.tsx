import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

/**
 * Satıldı filigranı — kart görselinin üzerine, köşeden köşeye uzanan
 * gri + blur arka planlı SATILDI yazısı.
 */
export function SoldOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Gri yarı-saydam arka plan */}
      <View style={styles.backdrop} />
      {/* Çapraz bant */}
      <View style={styles.band}>
        <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>
          SATILDI
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      } as object,
      default: {},
    }),
  },
  band: {
    position: 'absolute',
    // Köşeden köşeye uzanan bant: rotate 45° + yeterince geniş
    left: -60,
    right: -60,
    height: 36,
    top: '50%',
    marginTop: -18,
    backgroundColor: 'rgba(30,30,30,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-35deg' }],
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
    ...Platform.select({
      web: {
        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
      } as object,
      default: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
});
