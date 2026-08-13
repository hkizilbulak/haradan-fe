import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const primary = useThemeColor('primary');
  const primaryDark = useThemeColor('primaryDark');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');

  const isDisabled = disabled || loading;

  const palette = useMemo(() => {
    if (variant === 'primary') {
      return {
        bg: primary,
        fg: '#ffffff',
        border: primary,
        pressedBg: primaryDark,
      };
    }
    if (variant === 'secondary') {
      return {
        bg: surface,
        fg: text,
        border,
        pressedBg: border,
      };
    }
    if (variant === 'dark') {
      return {
        bg: header,
        fg: '#ffffff',
        border: header,
        pressedBg: '#1a1a1e',
      };
    }
    return {
      bg: 'transparent',
      fg: textSecondary,
      border: 'transparent',
      pressedBg: border,
    };
  }, [variant, primary, primaryDark, surface, border, text, textSecondary, header]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor: pressed ? palette.pressedBg : palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <Text style={[styles.label, { color: palette.fg }]} numberOfLines={1}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
  },
});
