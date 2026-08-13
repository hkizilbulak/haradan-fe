import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

export type BadgeTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const error = useThemeColor('error');
  const success = useThemeColor('success');
  const warning = useThemeColor('warning');
  const info = useThemeColor('info');
  const textMuted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  const bg =
    tone === 'danger'
      ? error
      : tone === 'success'
        ? success
        : tone === 'warning'
          ? warning
          : tone === 'info'
            ? info
            : surface;

  const fg = tone === 'neutral' ? textMuted : '#ffffff';
  const borderColor = tone === 'neutral' ? border : bg;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor },
        style,
      ]}
      accessibilityRole="text"
    >
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
