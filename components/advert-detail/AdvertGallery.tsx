import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useMediaImageSource } from '@/hooks/useMediaImageSource';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { PublicMediaItem } from '@/types';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

type AdvertGalleryProps = {
  items: PublicMediaItem[];
  height?: number;
  /** Kenardan kenara — mobil detay hero. */
  fullBleed?: boolean;
  /** Alt küçük görsel şeridi; mobilde genelde kapalı. */
  showThumbs?: boolean;
  /** Sahip önizlemesi — yayınlanmamış ilan görselleri için Bearer. */
  accessToken?: string | null;
};

export const AdvertGallery = memo(function AdvertGallery({
  items,
  height = 420,
  fullBleed = false,
  showThumbs = true,
  accessToken,
}: AdvertGalleryProps) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const skeleton = useThemeColor('skeleton');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const surface = useThemeColor('surface');

  const current = items[index] ?? items[0];
  const paused = useRef(false);
  const mainSource = useMediaImageSource(current?.publicUrl, accessToken);

  useEffect(() => {
    fade.setValue(0.35);
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      easing: EASE,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [index, fade]);

  // Sırayla otomatik geçiş
  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (paused.current) return;
      setIndex((i) => (i + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  const go = (dir: 1 | -1) => {
    if (items.length < 2) return;
    setIndex((i) => (i + dir + items.length) % items.length);
  };

  if (!current) return null;

  const bleed = fullBleed;

  return (
    <Pressable
      style={[styles.wrap, bleed && styles.wrapBleed]}
      onHoverIn={() => {
        paused.current = true;
      }}
      onHoverOut={() => {
        paused.current = false;
      }}
      // Hover only — dokunma galeriyi seçmesin
      accessible={false}
    >
      <View
        style={[
          styles.main,
          { height, backgroundColor: surface },
          bleed && styles.mainBleed,
        ]}
      >
        <Animated.View style={[styles.mainInner, { opacity: fade }]}>
          <Image
            key={current.assetId || current.publicUrl || index}
            source={mainSource}
            style={[styles.mainImg, { backgroundColor: skeleton }]}
            contentFit="cover"
            transition={280}
            priority="high"
            cachePolicy="memory-disk"
            recyclingKey={current.assetId}
          />
        </Animated.View>

        {items.length > 1 && !bleed ? (
          <>
            <Pressable
              onPress={() => go(-1)}
              accessibilityLabel="Önceki görsel"
              style={({ pressed }) => [
                styles.nav,
                styles.navLeft,
                { backgroundColor: surface, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={header} />
            </Pressable>
            <Pressable
              onPress={() => go(1)}
              accessibilityLabel="Sonraki görsel"
              style={({ pressed }) => [
                styles.nav,
                styles.navRight,
                { backgroundColor: surface, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={header} />
            </Pressable>
          </>
        ) : null}

        {items.length > 1 && bleed ? (
          <>
            <Pressable
              onPress={() => go(-1)}
              accessibilityLabel="Önceki görsel"
              style={[styles.bleedTap, styles.bleedTapLeft]}
            />
            <Pressable
              onPress={() => go(1)}
              accessibilityLabel="Sonraki görsel"
              style={[styles.bleedTap, styles.bleedTapRight]}
            />
            <View style={styles.dots} pointerEvents="none">
              {items.map((item, i) => (
                <View
                  key={item.assetId}
                  style={[
                    styles.dot,
                    i === index ? styles.dotActive : styles.dotIdle,
                  ]}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>

      {showThumbs && items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {items.map((item, i) => {
            const active = i === index;
            return (
              <Pressable
                key={item.assetId}
                onPress={() => setIndex(i)}
                style={[
                  styles.thumb,
                  {
                    borderColor: active ? header : border,
                    borderWidth: active ? 2 : 1,
                    ...Platform.select({
                      web: {
                        transition: 'border-color 180ms ease',
                        cursor: 'pointer' as const,
                      },
                      default: {},
                    }),
                  },
                ]}
              >
                <AuthMediaImage
                  uri={item.publicUrl}
                  accessToken={accessToken}
                  style={[styles.thumbImg, { backgroundColor: skeleton }]}
                  transition={180}
                  priority="low"
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </Pressable>
  );
});

function AuthMediaImage({
  uri,
  accessToken,
  style,
  transition,
  priority,
}: {
  uri: string;
  accessToken?: string | null;
  style: object;
  transition: number;
  priority: 'low' | 'high' | 'normal';
}) {
  const source = useMediaImageSource(uri, accessToken);
  return (
    <Image
      source={source}
      style={style}
      contentFit="cover"
      transition={transition}
      priority={priority}
      cachePolicy={accessToken ? 'memory' : 'memory-disk'}
    />
  );
}
const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  wrapBleed: { gap: 0 },
  main: {
    borderRadius: Radius.sheet,
    overflow: 'hidden',
    position: 'relative',
  },
  mainBleed: {
    borderRadius: 0,
  },
  mainInner: { flex: 1 },
  mainImg: { width: '100%', height: '100%' },
  nav: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(15,23,42,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
  thumbs: { gap: 10, paddingVertical: 2 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
  dotIdle: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  bleedTap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '34%',
    zIndex: 2,
  },
  bleedTapLeft: { left: 0 },
  bleedTapRight: { right: 0 },
});
