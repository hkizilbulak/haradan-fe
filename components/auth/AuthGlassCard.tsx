import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { Spacing } from '@/constants/Spacing';

type AuthGlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Liquid-glass panel — blur on web, frosted fallback on native. */
export function AuthGlassCard({ children, style }: AuthGlassCardProps) {
  return (
    <View style={[styles.outer, style]}>
      <View style={styles.highlight} pointerEvents="none" />
      <View style={styles.glass}>{children}</View>
    </View>
  );
}

const GLASS_RADIUS = 28;

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: GLASS_RADIUS,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0c0c0e',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.18,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: GLASS_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.25)',
  },
  glass: {
    borderRadius: GLASS_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.78)',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow:
          '0 24px 48px rgba(12,12,14,0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
      } as object,
      default: {},
    }),
  },
});
