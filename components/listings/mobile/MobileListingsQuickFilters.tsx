import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getCategoryIcon,
  getCategoryShortLabel,
} from '@/services/catalog/categoryDisplay';
import type { CategoryTreeNode } from '@/types';

type MobileListingsQuickFiltersProps = {
  categories: CategoryTreeNode[];
  categorySlug: string | null;
  urgentOnly: boolean;
  hasActiveFilters: boolean;
  onToggleUrgent: () => void;
  onSelectCategory: (slug: string | null) => void;
  onClear: () => void;
};

/**
 * İnce yatay pill şeridi — uzun kategori kutularını sayfadan kaldırır.
 */
export const MobileListingsQuickFilters = memo(
  function MobileListingsQuickFilters({
    categories,
    categorySlug,
    urgentOnly,
    hasActiveFilters,
    onToggleUrgent,
    onSelectCategory,
    onClear,
  }: MobileListingsQuickFiltersProps) {
    const text = useThemeColor('text');
    const textMuted = useThemeColor('textMuted');
    const header = useThemeColor('header');
    const border = useThemeColor('border');
    const bg = useThemeColor('background');

    return (
      <View style={styles.wrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <Pressable
            onPress={onToggleUrgent}
            accessibilityRole="button"
            accessibilityState={{ selected: urgentOnly }}
            accessibilityLabel="Acil ilanlar"
            style={({ pressed }) => [
              styles.pill,
              urgentOnly ? styles.pillUrgentOn : styles.pillOff,
              !urgentOnly && { borderColor: border, backgroundColor: bg },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons
              name="flash"
              size={11}
              color={urgentOnly ? '#fff' : '#e11d48'}
            />
            <Text
              style={[
                styles.pillText,
                { color: urgentOnly ? '#fff' : text },
              ]}
            >
              Acil
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const active = categorySlug === cat.slug;
            const label = getCategoryShortLabel(cat.slug, cat.name);
            const icon = getCategoryIcon(cat.slug);
            return (
              <Pressable
                key={cat.id}
                onPress={() => onSelectCategory(cat.slug)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={cat.name}
                style={({ pressed }) => [
                  styles.pill,
                  active
                    ? { backgroundColor: header, borderColor: header }
                    : { backgroundColor: bg, borderColor: border },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={12}
                  color={active ? '#fff' : textMuted}
                />
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? '#fff' : text },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}

          {hasActiveFilters ? (
            <Pressable
              onPress={onClear}
              accessibilityRole="button"
              accessibilityLabel="Filtreleri temizle"
              style={({ pressed }) => [
                styles.clear,
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={[styles.clearText, { color: textMuted }]}>
                Temizle
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.sm,
    marginHorizontal: -Spacing.md,
  },
  row: {
    paddingHorizontal: Spacing.md,
    gap: 6,
    alignItems: 'center',
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillOff: {},
  pillUrgentOn: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  clear: {
    height: 30,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
