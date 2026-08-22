import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type AuthBannerVariant = 'info' | 'success' | 'error';

type AuthBannerProps = {
  message: string;
  variant?: AuthBannerVariant;
};

export function AuthBanner({ message, variant = 'info' }: AuthBannerProps) {
  const { tokens } = useAuthTheme();

  const palette = {
    info: {
      bg: tokens.infoSoft ?? tokens.accentSoft,
      border: tokens.border,
      text: tokens.text,
      icon: 'information-circle' as const,
      color: tokens.textSecondary,
    },
    success: {
      bg: tokens.successSoft ?? '#f0fdf4',
      border: '#bbf7d0',
      text: tokens.success ?? '#16a34a',
      icon: 'checkmark-circle' as const,
      color: tokens.success ?? '#16a34a',
    },
    error: {
      bg: tokens.errorSoft ?? '#fef2f2',
      border: '#fecaca',
      text: tokens.error,
      icon: 'alert-circle' as const,
      color: tokens.error,
    },
  }[variant];

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name={palette.icon} size={18} color={palette.color} />
      <Text style={[styles.text, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
});
