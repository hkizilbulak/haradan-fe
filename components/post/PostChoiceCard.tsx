import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostChoiceCardProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress: () => void;
};

export function PostChoiceCard({
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
}: PostChoiceCardProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const errorLight = useThemeColor('errorLight');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? errorLight : surface,
          borderColor: selected ? primary : border,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
          ...Platform.select({
            web: {
              boxShadow: selected
                ? '0 8px 24px rgba(243, 71, 112, 0.12)'
                : '0 1px 0 rgba(15, 23, 42, 0.02)',
              cursor: 'pointer' as const,
            },
            default: {},
          }),
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: selected ? primary : border },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={selected ? '#fff' : text}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: secondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'chevron-forward'}
        size={selected ? 22 : 18}
        color={selected ? primary : secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    minHeight: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { ...Typography.h5 },
  sub: { ...Typography.caption },
});
