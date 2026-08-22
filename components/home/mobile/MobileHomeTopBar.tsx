import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/layout/BrandMark';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

type MobileHomeTopBarProps = {
  onMenuPress: () => void;
  onFavoritesPress: () => void;
  badgeCount?: number;
};

export function MobileHomeTopBar({
  onMenuPress,
  onFavoritesPress,
  badgeCount = 0,
}: MobileHomeTopBarProps) {
  const insets = useSafeAreaInsets();
  const primary = useThemeColor('primary');
  const badgeSuccess = useThemeColor('badgeSuccess');

  return (
    <View
      style={[styles.wrap, { top: insets.top + Spacing.sm }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        <GlassIconBtn
          icon="menu-outline"
          label="Menü"
          onPress={onMenuPress}
        />
        <View style={styles.brand} pointerEvents="none">
          <BrandMark variant="light" height={26} />
        </View>
        <View>
          <GlassIconBtn
            icon="heart-outline"
            label="Favoriler"
            onPress={onFavoritesPress}
          />
          {badgeCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: badgeSuccess }]}>
              <Text style={styles.badgeText}>
                {badgeCount > 9 ? '9+' : badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function GlassIconBtn({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconBtn,
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(12,12,14,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as object,
      default: {},
    }),
  },
  brand: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#0c0c0e',
    fontSize: 9,
    fontWeight: '800',
  },
});
