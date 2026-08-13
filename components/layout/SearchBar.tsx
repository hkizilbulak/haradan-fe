import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type SearchBarProps = {
  placeholder?: string;
  onPress?: () => void;
  variant?: 'dark' | 'light';
};

/** Soft premium search — minimal border, quiet fill. */
export function SearchBar({
  placeholder = 'Search',
  onPress,
  variant = 'dark',
}: SearchBarProps) {
  const isDark = variant === 'dark';
  const headerMuted = useThemeColor('headerMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const textMuted = useThemeColor('textMuted');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      style={({ pressed }) => [
        styles.bar,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : surface,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Ionicons
        name="search"
        size={14}
        color={isDark ? headerMuted : textMuted}
      />
      <Text
        style={[
          styles.placeholder,
          { color: isDark ? headerMuted : textMuted },
        ]}
        numberOfLines={1}
      >
        {placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
  },
  placeholder: {
    ...Typography.small,
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
  },
});
