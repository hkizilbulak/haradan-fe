import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from '@/components/layout/BrandMark';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { glassSurface } from '@/components/layout/glassStyles';

type MobileHomeTopBarProps = {
  onMenuPress: () => void;
  onPostAdPress: () => void;
};

export function MobileHomeTopBar({
  onMenuPress,
  onPostAdPress,
}: MobileHomeTopBarProps) {
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
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="menu-outline" size={22} color="#fff" />
        </Pressable>

        <View style={styles.brand} pointerEvents="none">
          <BrandMark variant="light" height={26} />
        </View>

        <Pressable
          onPress={onPostAdPress}
          accessibilityRole="button"
          accessibilityLabel="İlan ver"
          style={({ pressed }) => [
            styles.postBtn,
            { backgroundColor: primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.postLabel}>İlan Ver</Text>
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
    zIndex: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 52,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    minHeight: 40,
    ...Platform.select({
      web: {
        transition: 'opacity 160ms ease',
      } as object,
      default: {},
    }),
  },
  postLabel: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
