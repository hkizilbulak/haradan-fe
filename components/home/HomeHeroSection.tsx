import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HomeSearchBar } from './HomeSearchBar';
import { navigateToListings } from '@/services/navigation';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';

const DYNAMIC_WORDS = [
  'yarış atını',
  'kısrağı',
  'tayı',
  'aygırı',
  'hizmeti',
];

const QUICK_ACCESS_LINKS: Array<{
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  params: Record<string, string>;
}> = [
    {
      id: 'vitrin',
      title: 'Vitrin İlanları',
      icon: 'diamond-outline' as const,
      color: '#eab308',
      params: { featured: '1' },
    },
    {
      id: 'acil',
      title: 'Acil İlanlar',
      icon: 'flash-outline' as const,
      color: '#ef4444',
      params: { urgent: '1' },
    },
    {
      id: 'kosar',
      title: 'Koşar Durumda Atlar',
      icon: 'trophy-outline' as const,
      color: '#3b82f6',
      params: { q: 'Koşar Durumda' },
    },
    {
      id: 'kisrak',
      title: 'Satılık Kısraklar',
      icon: 'female-outline' as const,
      color: '#ec4899',
      params: { category: 'satilik-kisrak' },
    },
    {
      id: 'tay',
      title: 'Satılık Taylar',
      icon: 'sparkles-outline' as const,
      color: '#a855f7',
      params: { category: 'satilik-tay' },
    },
    {
      id: 'aygir',
      title: 'Aşım Aygırları',
      icon: 'flame-outline' as const,
      color: '#f97316',
      params: { category: 'asim-hizmetleri' },
    },
    {
      id: 'pansiyon',
      title: 'Pansiyon Haralar',
      icon: 'home-outline' as const,
      color: '#06b6d4',
      params: { category: 'pansiyon-haralar' },
    },
    {
      id: 'nakliye',
      title: 'At Nakliyesi',
      icon: 'car-outline' as const,
      color: '#10b981',
      params: { category: 'at-nakliyesi' },
    },
  ];

const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=1600&auto=format&fit=crop';

type HomeHeroSectionProps = {
  onSearchSubmit?: (query: string) => void;
};

export const HomeHeroSection = memo(function HomeHeroSection({
  onSearchSubmit,
}: HomeHeroSectionProps) {
  const router = useRouter();
  const width = useLayoutWidth();
  const isWide = width >= 860;

  const [wordIndex, setWordIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out & slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: -12,
          duration: 250,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setWordIndex((prev) => (prev + 1) % DYNAMIC_WORDS.length);
        slideAnim.setValue(12);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: false,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: false,
          }),
        ]).start();
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [fadeAnim, slideAnim]);

  const handleLinkPress = (params: Record<string, string>) => {
    navigateToListings(router, params);
  };

  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const primary = useThemeColor('primary');

  return (
    <View style={styles.container}>
      {/* Hero Banner Box */}
      <View style={[styles.heroCard, { minHeight: isWide ? 440 : 380 }]}>
        <View style={styles.heroBackground}>
          <Image
            source={{ uri: HERO_BG_IMAGE }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={400}
          />
          {/* Dark overlay for contrast */}
          <View style={styles.overlay} />
        </View>

        <View style={styles.heroContent}>
          {/* Animated Headline */}
          <View style={styles.headlineContainer}>
            {/* Line 1: Aradığın + [Dinamik Kelime] */}
            <View style={styles.headlineRow}>
              <Text style={[styles.headlineText, !isWide && styles.headlineTextMobile]}>
                Aradığın
              </Text>

              <Animated.View
                style={[
                  styles.wordBadge,
                  !isWide && styles.wordBadgeMobile,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={[styles.wordText, { color: primary }, !isWide && styles.wordTextMobile]}>
                  {DYNAMIC_WORDS[wordIndex]}
                </Text>
              </Animated.View>
            </View>

            {/* Line 2: bulmak için HARADAN! */}
            <View style={styles.headlineRow}>
              <Text style={[styles.headlineText, !isWide && styles.headlineTextMobile]}>
                bulmak için{' '}
              </Text>
              <Text style={[styles.headlineText, styles.brandHighlight, !isWide && styles.headlineTextMobile]}>
                HARADAN!
              </Text>
            </View>
          </View>

          {/* Search Box Overlaid on Image */}
          <View style={[styles.searchBoxCard, isWide && styles.searchBoxCardWide]}>
            <HomeSearchBar compact fullWidth variant="glass" />
          </View>
        </View>
      </View>

      {/* Hızlı Erişim Linkleri (Hepsiemlak Pill Chips Style) */}
      <View style={styles.quickAccessSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessScroll}
        >
          {QUICK_ACCESS_LINKS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleLinkPress(item.params)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [
                styles.quickAccessChip,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Ionicons name={item.icon} size={16} color={item.color} style={styles.quickAccessIcon} />
              <Text style={[styles.quickAccessLabel, { color: text }]} numberOfLines={1}>
                {item.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    position: 'relative',
    zIndex: 100,
  },
  heroCard: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    zIndex: 100,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
      },
      default: {},
    }),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  heroContent: {
    width: '100%',
    maxWidth: 860,
    alignItems: 'center',
    zIndex: 2,
  },
  headlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: 6,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  headlineText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headlineTextMobile: {
    fontSize: 21,
    letterSpacing: -0.3,
  },
  brandHighlight: {
    fontWeight: '900',
  },
  wordBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    marginLeft: 8,
  },
  wordBadgeMobile: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  wordText: {
    color: '#ff6000',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  wordTextMobile: {
    fontSize: 21,
    letterSpacing: -0.3,
  },

  searchBoxCard: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  searchBoxCardWide: {
    maxWidth: 780,
  },
  quickAccessSection: {
    marginTop: Spacing.lg,
    width: '100%',
    overflow: 'hidden',
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  quickAccessScroll: {
    gap: 8,
    paddingHorizontal: 0,
    paddingBottom: 4,
  },
  quickAccessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 42,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 180ms ease',
      },
      default: {},
    }),
  },
  quickAccessIcon: {
    opacity: 0.45,
  },
  quickAccessLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
