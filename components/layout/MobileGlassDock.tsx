import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';
import { navigateToListings } from '@/services/navigation';

type DockTab = 'index' | 'listings' | 'post' | 'favorites' | 'profile';

/**
 * Floating liquid-glass tab dock — mobil alt navigasyon + footer hissi.
 */
export function MobileGlassDock({ state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');

  const activeRoute = state.routes[state.index]?.name ?? 'index';
  const active: DockTab =
    activeRoute === 'favorites'
      ? 'favorites'
      : activeRoute === 'profile'
        ? 'profile'
        : 'index';

  const go = (key: DockTab) => {
    if (key === 'post') {
      prepareListingWizardEntry();
      router.push('/post');
      return;
    }
    if (key === 'listings') {
      navigateToListings(router, {});
      return;
    }
    if (key === 'index') router.push('/(tabs)');
    if (key === 'favorites') router.push('/(tabs)/favorites');
    if (key === 'profile') router.push('/(tabs)/profile');
  };

  const items: {
    key: DockTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
    center?: boolean;
  }[] = [
    { key: 'index', label: 'Ana', icon: 'home-outline', iconActive: 'home' },
    { key: 'listings', label: 'İlanlar', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'post', label: 'Ver', icon: 'add', iconActive: 'add', center: true },
    { key: 'favorites', label: 'Favori', icon: 'heart-outline', iconActive: 'heart' },
    { key: 'profile', label: 'Hesap', icon: 'person-outline', iconActive: 'person' },
  ];

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.dock}>
        {items.map((item) => {
          const isActive = item.key === active;
          const color = isActive ? primary : textMuted;

          if (item.center) {
            return (
              <Pressable
                key={item.key}
                onPress={() => go(item.key)}
                accessibilityRole="button"
                accessibilityLabel="İlan ver"
                style={({ pressed }) => [
                  styles.fabWrap,
                  pressed ? { opacity: 0.9, transform: [{ scale: 0.96 }] } : null,
                ]}
              >
                <View style={[styles.fab, { backgroundColor: primary }]}>
                  <Ionicons name="add" size={26} color="#fff" />
                </View>
                <Text style={[styles.fabLabel, { color: text }]}>{item.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.key}
              onPress={() => go(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={22}
                color={color}
              />
              <Text style={[styles.label, { color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.copy, { color: textMuted }]}>
        © {new Date().getFullYear()} Haradan.com
      </Text>
    </View>
  );
}

const DOCK_RADIUS = 28;

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 6,
    pointerEvents: 'box-none',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: DOCK_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.82)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 12px 40px rgba(12,12,14,0.14)',
      } as object,
      ios: {
        shadowColor: '#0c0c0e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
    gap: 4,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#f34770',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  copy: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
});
