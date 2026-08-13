import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColor } from '@/hooks/useThemeColor';

/** Cartzilla auth hero — lifestyle, smartphone. */
export const AUTH_HERO_IMAGE =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80';

type AuthHeroPanelProps = {
  imageUri?: string;
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
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="contain"
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    maxWidth: 520,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
