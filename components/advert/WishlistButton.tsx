import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

type WishlistButtonProps = {
  active: boolean;
  size?: 'sm' | 'md';
  variant?: 'transparent' | 'circle';
  onPress?: () => void;
};

export function WishlistButton({
  active,
  size = 'md',
  variant = 'transparent',
  onPress,
}: WishlistButtonProps) {
  const error = useThemeColor('error');
  const isCircle = variant === 'circle';
  const dim = size === 'sm' ? (isCircle ? 30 : 28) : 36;
  const icon = size === 'sm' ? (isCircle ? 16 : 18) : (isCircle ? 19 : 22);

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
        isCircle && styles.circleBtn,
        {
          width: dim,
          height: dim,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={icon}
        color={active ? error : isCircle ? '#334155' : '#ffffff'}
        style={!isCircle ? styles.icon : undefined}
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
  circleBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'transform 180ms ease',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
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
