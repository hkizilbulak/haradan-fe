import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useSafeInsets } from '@/hooks/useSafeInsets';

type MobileAdvertTopBarProps = {
  onBack: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  showFavorite?: boolean;
};

/** Galeri üzerinde yüzen geri butonu. */
export function MobileAdvertTopBar({
  onBack,
  favorite = false,
  onToggleFavorite,
  showFavorite = false,
}: MobileAdvertTopBarProps) {
  const insets = useSafeInsets();

  return (
    <View
      style={[styles.wrap, { top: insets.top + Spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Geri"
        hitSlop={8}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </Pressable>

      {showFavorite && onToggleFavorite ? (
        <Pressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
          hitSlop={8}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }]}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={favorite ? '#f34770' : '#fff'}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,12,14,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)' } as object,
      default: {},
    }),
  },
});
