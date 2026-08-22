import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import {
  getCategoryIcon,
  pickListingRootCategories,
} from '@/services/catalog/categoryDisplay';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryTreeNode } from '@/types';

type CategoryStripProps = {
  /** Catalog ağacı kökleri — pickListingRootCategories ile filtrelenir. */
  categories: CategoryTreeNode[];
  activeId?: string | null;
  onSelect?: (category: CategoryTreeNode) => void;
  /** Hero altı premium kısayol şeridi */
  variant?: 'default' | 'premium';
};

export function CategoryStrip({
  categories,
  activeId,
  onSelect,
  variant = 'default',
}: CategoryStripProps) {
  const primary = useThemeColor('primary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');

  const roots = useMemo(
    () => pickListingRootCategories(categories),
    [categories]
  );

  if (roots.length === 0) return null;

  if (variant === 'premium') {
    return (
      <View style={styles.premiumWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.premiumList}
          accessibilityRole="tablist"
        >
          {roots.map((cat) => {
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
                  styles.premiumItem,
                  pressed && { opacity: 0.82 },
                ]}
              >
                <View
                  style={[
                    styles.premiumIcon,
                    {
                      backgroundColor: active
                        ? primary
                        : 'rgba(255,255,255,0.16)',
                      borderColor: active
                        ? primary
                        : 'rgba(255,255,255,0.22)',
                    },
                  ]}
                >
                  <Ionicons name={icon} size={22} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.premiumLabel,
                    { color: active ? '#fff' : 'rgba(255,255,255,0.88)' },
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

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        accessibilityRole="tablist"
      >
        {roots.map((cat) => {
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

const PREMIUM_ITEM_W = 76;

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
  premiumWrap: {
    marginTop: 2,
  },
  premiumList: {
    gap: 12,
    paddingHorizontal: 2,
  },
  premiumItem: {
    width: PREMIUM_ITEM_W,
    alignItems: 'center',
    gap: 8,
  },
  premiumIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  premiumLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
    letterSpacing: -0.1,
    maxWidth: PREMIUM_ITEM_W,
  },
});
