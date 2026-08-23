import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/layout/BrandMark';
import { glassSurface } from '@/components/layout/glassStyles';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';

type MobileListingsTopBarProps = {
  onMenuPress: () => void;
  onFilterPress: () => void;
  filterCount?: number;
  title?: string;
};

/** Ara sayfası — havada siyah pill header (menü + marka + filtre). */
export function MobileListingsTopBar({
  onMenuPress,
  onFilterPress,
  filterCount = 0,
  title = 'Ara',
}: MobileListingsTopBarProps) {
  const insets = useSafeInsets();
  const primary = useThemeColor('primary');

  return (
    <View
      style={[styles.wrap, { top: insets.top + Spacing.sm }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, glassSurface.headerFloat]}>
        <Pressable
          onPress={onMenuPress}
          accessibilityRole="button"
          accessibilityLabel="Menü"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="menu-outline" size={22} color="#fff" />
        </Pressable>

        <View style={styles.center} pointerEvents="none">
          <BrandMark variant="light" height={22} />
          <Text style={styles.title}>{title}</Text>
        </View>

        <Pressable
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel={
            filterCount > 0 ? `Filtreler, ${filterCount} aktif` : 'Filtreler'
          }
          style={({ pressed }) => [
            styles.filterBtn,
            { backgroundColor: filterCount > 0 ? primary : 'rgba(255,255,255,0.1)' },
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons name="options-outline" size={16} color="#fff" />
          <Text style={styles.filterLabel}>Filtre</Text>
          {filterCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {filterCount > 9 ? '9+' : String(filterCount)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 30,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 52,
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    minHeight: 40,
    zIndex: 1,
    ...Platform.select({
      web: { transition: 'opacity 160ms ease' } as object,
      default: {},
    }),
  },
  filterLabel: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#0c0c0e',
    fontSize: 10,
    fontWeight: '800',
  },
});
