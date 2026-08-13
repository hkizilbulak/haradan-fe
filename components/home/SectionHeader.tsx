import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

/** Cartzilla bölüm başlığı — büyük bold "New arrivals". */
export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');

  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={[styles.title, { color: text }]}>{title}</Text>
      {onActionPress && actionLabel ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${title} — ${actionLabel}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.action, { color: primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
  },
});
