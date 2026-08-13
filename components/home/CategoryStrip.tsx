import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryTreeNode } from '@/types';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'yaris-atlari': 'trophy-outline',
  binicilik: 'walk-outline',
  ciftlik: 'leaf-outline',
  tay: 'paw-outline',
  damizlik: 'heart-circle-outline',
  ekipman: 'construct-outline',
};

type CategoryStripProps = {
  categories: CategoryTreeNode[];
  activeId?: string | null;
  onSelect?: (category: CategoryTreeNode) => void;
};

export function CategoryStrip({
  categories,
  activeId,
  onSelect,
}: CategoryStripProps) {
  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');

  if (categories.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        accessibilityRole="tablist"
      >
        {categories.map((cat) => {
          const active = cat.id === activeId;
          const icon = CATEGORY_ICONS[cat.slug] ?? 'ellipse-outline';
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect?.(cat)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.name}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? primary : surface,
                  borderColor: active ? primary : border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={16}
                color={active ? '#fff' : primary}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? '#fff' : text },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              {cat.children.length > 0 ? (
                <Text
                  style={{
                    ...Typography.caption,
                    color: active ? '#ffffffcc' : textSecondary,
                  }}
                >
                  {cat.children.length}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
  },
  list: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    ...Typography.small,
    fontWeight: '600',
  },
});
