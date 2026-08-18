import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

type RemoveDraftButtonProps = {
  size?: 'sm' | 'md';
  disabled?: boolean;
  onPress?: () => void;
};

/** Taslak kartı — favori yanındaki kırmızı eksi (remove-circle). */
export function RemoveDraftButton({
  size = 'md',
  disabled = false,
  onPress,
}: RemoveDraftButtonProps) {
  const error = useThemeColor('error');
  const dim = size === 'sm' ? 28 : 36;
  const icon = size === 'sm' ? 18 : 22;

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        if (!disabled) onPress?.();
      }}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Taslağı sil"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btn,
        {
          width: dim,
          height: dim,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons
        name="remove-circle"
        size={icon}
        color={error}
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
