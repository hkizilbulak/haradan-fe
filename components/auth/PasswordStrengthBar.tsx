import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuthTheme } from './AuthThemeContext';

type PasswordStrengthBarProps = {
  password: string;
};

function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const LABELS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'] as const;
const COLORS = ['#e3e9ef', '#f59e0b', '#f59e0b', '#42d697', '#16a34a'];

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { tokens } = useAuthTheme();
  const score = useMemo(() => scorePassword(password), [password]);

  if (!password) return null;

  return (
    <View style={styles.wrap} accessibilityLabel={`Parola gücü: ${LABELS[score]}`}>
      <View style={styles.segments}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                backgroundColor: i <= score ? COLORS[score] : tokens.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: tokens.textMuted }]}>
        {LABELS[score]}
        {score < 2 ? ' · en az 8 karakter' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
    marginTop: -Spacing.xs,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    ...Typography.caption,
  },
});
