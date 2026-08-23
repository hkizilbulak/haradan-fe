import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';

type MobileScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

/** Sekme ekranları — minimal sticky başlık (Favoriler vb.). */
export function MobileScreenHeader({
  title,
  subtitle,
  right,
}: MobileScreenHeaderProps) {
  const insets = useSafeInsets();
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const bg = useThemeColor('background');

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: bg,
          borderBottomColor: border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: { flex: 1, gap: 2 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sub: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '500',
  },
});
