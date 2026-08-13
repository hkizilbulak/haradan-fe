import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

type WishlistButtonProps = {
  active: boolean;
  size?: 'sm' | 'md';
  onPress?: () => void;
};

export function WishlistButton({
  active,
  size = 'md',
  onPress,
}: WishlistButtonProps) {
  const error = useThemeColor('error');
  const dim = size === 'sm' ? 28 : 36;
  const icon = size === 'sm' ? 18 : 22;

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        onPress?.();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.btn,
        {
          width: dim,
          height: dim,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={icon}
        color={active ? error : '#ffffff'}
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  icon: {
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.45)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
});
