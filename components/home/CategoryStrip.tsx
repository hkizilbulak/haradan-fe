import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import {
  getCategoryIcon,
  pickListingRootCategories,
} from '@/services/catalog/categoryDisplay';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryTreeNode } from '@/types';

type CategoryStripProps = {
  categories: CategoryTreeNode[];
  activeId?: string | null;
  onSelect?: (category: CategoryTreeNode) => void;
  variant?: 'default' | 'premium';
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
  const textMuted = useThemeColor('textMuted');

  // Collect display categories (both roots and prominent sub-categories)
  const displayItems = useMemo(() => {
    const roots = pickListingRootCategories(categories);
    const result: CategoryTreeNode[] = [];

    roots.forEach((root) => {
      if (root.children && root.children.length > 0) {
        root.children.forEach((child) => result.push(child));
      } else {
        result.push(root);
      }
    });

    // Fallback if no subcategories expanded
    return result.length > 0 ? result : roots;
  }, [categories]);

  if (displayItems.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>Kategoriler</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        accessibilityRole="tablist"
      >
        {displayItems.map((cat) => {
          const active = cat.id === activeId;
          const icon = getCategoryIcon(cat.slug);

          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect?.(cat)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.name}
              style={({ pressed }) => [
                styles.boxCard,
                {
                  backgroundColor: active ? primary : surface,
                  borderColor: active ? primary : border,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: active
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(59, 130, 246, 0.08)',
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={24}
                  color={active ? '#ffffff' : primary}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: active ? '#ffffff' : text },
                ]}
                numberOfLines={2}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  list: {
    paddingHorizontal: 2,
    gap: 12,
    paddingBottom: 4,
  },
  boxCard: {
    width: 140,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 180ms ease',
      },
      default: {},
    }),
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
});
