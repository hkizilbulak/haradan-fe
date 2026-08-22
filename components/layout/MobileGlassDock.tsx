import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOBILE_DOCK_BAR_HEIGHT } from '@/constants/Layout';
import { useThemeColor } from '@/hooks/useThemeColor';
import { prepareListingWizardEntry } from '@/services/listing';
import { navigateToListings } from '@/services/navigation';
import { glassSurface } from './glassStyles';

type SideAction = 'search' | 'favorites' | 'discover' | 'profile';

type SideItem = {
  key: SideAction;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const LEFT: SideItem[] = [
  { key: 'search', label: 'Ara', icon: 'search-outline', iconActive: 'search' },
  {
    key: 'favorites',
    label: 'Favorilerim',
    icon: 'heart-outline',
    iconActive: 'heart',
  },
];

const RIGHT: SideItem[] = [
  {
    key: 'discover',
    label: 'Keşfet',
    icon: 'compass-outline',
    iconActive: 'compass',
  },
  {
    key: 'profile',
    label: 'Hesabım',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

function normalizePath(pathname: string): string {
  const base = pathname.split('?')[0] ?? '/';
  if (base === '/(tabs)' || base === '/(tabs)/') return '/';
  return base.replace(/\/\(tabs\)/g, '') || '/';
}

/**
 * Referans tab bar — Ara | Favorilerim | İlan Ver | Keşfet | Hesabım.
 * Root overlay; web + native mobil viewport.
 */
export function MobileGlassDock() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rawPath = usePathname();
  const pathname = normalizePath(rawPath);
  const primary = useThemeColor('primary');
  const muted = useThemeColor('headerMuted');

  const isActive = (key: SideAction): boolean => {
    if (key === 'discover') {
      return pathname === '/' || pathname === '/index';
    }
    if (key === 'favorites') {
      return pathname === '/favorites' || pathname.endsWith('/favorites');
    }
    if (key === 'profile') {
      return pathname === '/profile' || pathname.endsWith('/profile');
    }
    if (key === 'search') {
      return pathname.startsWith('/listings');
    }
    return false;
  };

  const go = (key: SideAction) => {
    switch (key) {
      case 'search':
        navigateToListings(router, {});
        break;
      case 'favorites':
        router.push('/(tabs)/favorites');
        break;
      case 'discover':
        router.push('/(tabs)');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      default:
        break;
    }
  };

  const onPost = () => {
    prepareListingWizardEntry();
    router.push('/post');
  };

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.host,
        Platform.OS === 'web' ? (styles.hostWeb as object) : null,
      ]}
      pointerEvents="box-none"
      accessibilityRole="toolbar"
      nativeID="mobile-glass-dock"
    >
      <View
        style={[
          styles.outer,
          glassSurface.dockDark,
          {
            paddingBottom: bottomPad,
            minHeight: MOBILE_DOCK_BAR_HEIGHT + bottomPad,
          },
        ]}
      >
        <View style={styles.row}>
          {LEFT.map((item) => (
            <DockTab
              key={item.key}
              item={item}
              active={isActive(item.key)}
              primary={primary}
              muted={muted}
              onPress={() => go(item.key)}
            />
          ))}

          <View style={styles.centerSlot}>
            <Pressable
              onPress={onPost}
              accessibilityRole="button"
              accessibilityLabel="İlan ver"
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
            <Text style={[styles.centerLabel, { color: primary }]}>İlan Ver</Text>
          </View>

          {RIGHT.map((item) => (
            <DockTab
              key={item.key}
              item={item}
              active={isActive(item.key)}
              primary={primary}
              muted={muted}
              onPress={() => go(item.key)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function DockTab({
  item,
  active,
  primary,
  muted,
  onPress,
}: {
  item: SideItem;
  active: boolean;
  primary: string;
  muted: string;
  onPress: () => void;
}) {
  const color = active ? primary : muted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
    >
      <View
        style={[
          styles.tabPill,
          active && { backgroundColor: `${primary}18` },
        ]}
      >
        <Ionicons
          name={active ? item.iconActive : item.icon}
          size={22}
          color={color}
        />
      </View>
      <Text style={[styles.tabLabel, { color: active ? primary : muted }]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: {
    ...Platform.select({
      ios: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      },
      android: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        elevation: 9999,
        zIndex: 9999,
      },
      web: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      },
      default: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      },
    }),
  },
  hostWeb: {
    position: 'fixed',
  } as object,
  outer: {
    width: '100%',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
    minWidth: 0,
  },
  tabPill: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
    gap: 4,
    minWidth: 0,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(12,12,14,0.94)',
    ...Platform.select({
      ios: {
        shadowColor: '#f34770',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
      web: {
        boxShadow: '0 8px 24px rgba(243,71,112,0.45)',
      } as object,
      default: {},
    }),
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
