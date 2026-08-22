import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColor } from '@/hooks/useThemeColor';

/** Haradan auth hero — at fotoğrafı. */
export const AUTH_HERO_IMAGE = require('@/assets/brand/auth-hero.jpg');

type AuthHeroPanelProps = {
  imageUri?: string | number | object;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const PANEL_RADIUS = 28;

export function AuthHeroPanel({
  imageUri = AUTH_HERO_IMAGE,
}: AuthHeroPanelProps) {
  const hero = useThemeColor('hero');
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 720,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(imageY, {
        toValue: 0,
        duration: 720,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start();
  }, [imageOpacity, imageY]);

  return (
    <View
      style={[styles.panel, { backgroundColor: hero }]}
      accessibilityElementsHidden
    >
      <Animated.View
        style={[
          styles.imageWrap,
          { opacity: imageOpacity, transform: [{ translateY: imageY }] },
        ]}
      >
        <Image
          source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
          style={styles.image}
          contentFit="cover"
          transition={480}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    borderTopLeftRadius: PANEL_RADIUS,
    borderBottomLeftRadius: PANEL_RADIUS,
    overflow: 'hidden',
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
