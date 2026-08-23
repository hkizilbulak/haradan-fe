import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';

type MobileScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

/** Sekme ekranları — minimal sticky başlık (Favoriler vb.). */
export function MobileScreenHeader({
  title,
  subtitle,
  onBack,
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
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={24} color={text} />
          </Pressable>
        ) : null}
        <View style={[styles.copy, onBack ? styles.copyIndented : null]}>
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
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  copyIndented: { marginLeft: -4 },
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
