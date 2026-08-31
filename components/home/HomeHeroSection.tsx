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

const QUICK_ACCESS_LINKS = [
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
    title: 'Koşar Durumda Yarış Atları',
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
    id: 'aygir',
    title: 'Aşım Aygırları',
    icon: 'flame-outline' as const,
    color: '#f97316',
    params: { category: 'asim-hizmetleri' },
  },
  {
    id: 'nakliye',
    title: 'At Nakliyesi & Tesisler',
    icon: 'car-outline' as const,
    color: '#10b981',
    params: { category: 'at-hizmetleri' },
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
          <View style={styles.headlineWrap}>
            <Text style={[styles.headlineText, !isWide && styles.headlineTextMobile]}>
              Aradığın{' '}
            </Text>

            <Animated.View
              style={[
                styles.wordBadge,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.wordText, !isWide && styles.wordTextMobile]}>
                {DYNAMIC_WORDS[wordIndex]}
              </Text>
            </Animated.View>

            <Text style={[styles.headlineText, !isWide && styles.headlineTextMobile]}>
              {' '}bulup
            </Text>
          </View>

          <View style={styles.subHeadlineWrap}>
            <View style={styles.ohhBeBadge}>
              <Text style={styles.ohhBeText}>TAM İSABET</Text>
            </View>
            <Text style={[styles.headlineText, !isWide && styles.headlineTextMobile]}>
              {' '}demek için Haradan!
            </Text>
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
              <View style={[styles.iconChip, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={15} color={item.color} />
              </View>
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
  headlineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  subHeadlineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  headlineText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headlineTextMobile: {
    fontSize: 22,
  },
  wordBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  wordText: {
    color: '#38bdf8',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  wordTextMobile: {
    fontSize: 22,
  },
  ohhBeBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    marginHorizontal: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)',
      },
      default: {},
    }),
  },
  ohhBeText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    gap: 10,
    paddingHorizontal: 2,
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
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
