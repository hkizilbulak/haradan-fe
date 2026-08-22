import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BrandMark } from '@/components/layout/BrandMark';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_HERO_IMAGE } from './AuthHeroPanel';

type AuthMobileHeroProps = {
  tagline: string;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export function AuthMobileHero({ tagline }: AuthMobileHeroProps) {
  const { tokens } = useAuthTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View style={styles.wrap} accessibilityElementsHidden>
      <Image source={AUTH_HERO_IMAGE} style={styles.image} contentFit="cover" />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tokens.heroOverlay ?? 'rgba(12,12,14,0.58)' },
        ]}
      />
      <Animated.View
        style={[
          styles.content,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <BrandMark variant="light" height={32} />
        <Text style={styles.tagline}>{tagline}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 8,
    gap: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    maxWidth: 280,
    lineHeight: 22,
  },
});
