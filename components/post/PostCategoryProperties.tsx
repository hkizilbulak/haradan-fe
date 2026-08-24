import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PostField } from './PostField';
import {
  type ListingFieldErrors,
} from '@/services/listing';
import { catalogRepository } from '@/services/catalog';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryPropertyPublic } from '@/types';
import type { ListingDraft, ListingDraftDetails } from '@/types/listing';

type PostCategoryPropertiesProps = {
  draft: ListingDraft;
  onUpdate: (partial: Partial<ListingDraftDetails>) => void;
  errors?: ListingFieldErrors;
  onLayoutSection?: (key: string, y: number) => void;
};

type ToggleItemProps = {
  label: string;
  value: boolean;
  onToggle: () => void;
};

function ToggleItem({ label, value, onToggle }: ToggleItemProps) {
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');
  const border = useThemeColor('border');

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [
        styles.toggleRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text
        style={[
          styles.toggleLabel,
          {
            color: value ? text : textSecondary,
            fontWeight: value ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.switch,
          {
            backgroundColor: value ? header : border,
            justifyContent: value ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View style={styles.switchKnob} />
      </View>
    </Pressable>
  );
}

export function PostCategoryProperties({
  draft,
  onUpdate,
  errors = {},
  onLayoutSection,
}: PostCategoryPropertiesProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');

  const d = draft.details;
  const type = draft.type;

  const [categoryProperties, setCategoryProperties] = useState<CategoryPropertyPublic[]>([]);

  useEffect(() => {
    const catId = type?.categoryId || type?.categorySlug;
    if (!catId) {
      setCategoryProperties([]);
      return;
    }
    let cancelled = false;

    const loadProps = () => {
      catalogRepository
        .getCategoryFormDefinition(catId, {
          fresh: true,
          categorySlug: type?.categorySlug,
        } as any)
        .then((def) => {
          if (cancelled) return;
          if (def && Array.isArray(def.properties)) {
            setCategoryProperties(def.properties);
          } else {
            setCategoryProperties([]);
          }
        })
        .catch(() => {
          if (!cancelled) setCategoryProperties([]);
        });
    };

    loadProps();

    if (typeof window !== 'undefined') {
      window.addEventListener('haradan_category_properties_changed', loadProps);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('haradan_category_properties_changed', loadProps);
      }
    };
  }, [type?.categoryId, type?.categorySlug]);

  const visibleProperties = useMemo(() => {
    if (!categoryProperties || categoryProperties.length === 0) return [];
    return categoryProperties.filter((prop) => prop.isFormVisible !== false);
  }, [categoryProperties]);

  const renderPropertyItem = (prop: CategoryPropertyPublic) => {
    const propKey = prop.code || prop.title;
    const currentProps = d.properties || {};
    const val = currentProps[prop.code] ?? currentProps[propKey] ?? currentProps[prop.title];

    if (prop.dataType === 'BOOLEAN') {
      return (
        <ToggleItem
          key={propKey}
          label={prop.title}
          value={Boolean(val)}
          onToggle={() =>
            onUpdate({
              properties: {
                ...currentProps,
                [propKey]: !val,
              },
            })
          }
        />
      );
    }

    if (prop.options && prop.options.length > 0) {
      return (
        <View key={propKey} style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: secondary }]}>
            {prop.title}
            {prop.isRequired ? (
              <Text style={{ color: errorColor }}> *</Text>
            ) : null}
          </Text>
          <View style={styles.chips}>
            {prop.options.map((opt) => {
              const optVal = opt.value || opt.label;
              const on =
                String(val ?? '') === optVal ||
                String(val ?? '') === opt.value ||
                String(val ?? '') === opt.label;
              return (
                <Pressable
                  key={optVal}
                  onPress={() =>
                    onUpdate({
                      properties: {
                        ...currentProps,
                        [propKey]: opt.value || optVal,
                      },
                    })
                  }
                  style={[
                    styles.chip,
                    {
                      borderColor: on ? header : border,
                      backgroundColor: on ? header : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: on ? '#fff' : text },
                    ]}
                  >
                    {opt.label || opt.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    const isNumeric =
      prop.dataType === 'INTEGER' ||
      prop.dataType === 'DECIMAL' ||
      prop.dataType === 'YEAR';

    return (
      <PostField
        key={propKey}
        label={prop.title}
        required={prop.isRequired}
        value={val != null ? String(val) : ''}
        onChangeText={(textVal) => {
          let finalVal: unknown = textVal;
          if (isNumeric) {
            const cleaned = textVal.trim().replace(',', '.');
            if (cleaned !== '' && !isNaN(Number(cleaned))) {
              finalVal =
                prop.dataType === 'INTEGER' || prop.dataType === 'YEAR'
                  ? parseInt(cleaned, 10)
                  : parseFloat(cleaned);
            }
          }
          onUpdate({
            properties: {
              ...currentProps,
              [propKey]: finalVal,
            },
          });
        }}
        placeholder={prop.helpText || `${prop.title} girin`}
        keyboardType={isNumeric ? 'numeric' : 'default'}
      />
    );
  };

  const categoryTitle = type?.categoryName
    ? `${type.categoryName} Özellikleri`
    : 'Kategori Özellikleri';

  if (visibleProperties.length === 0) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onLayout={(e) =>
        onLayoutSection?.('categoryProperties', e.nativeEvent.layout.y)
      }
    >
      <Text style={[styles.section, { color: text }]}>{categoryTitle}</Text>
      <Text style={[styles.desc, { color: secondary }]}>
        Bu kategori için tanımlanmış özellikleri girin.
      </Text>

      {visibleProperties.map((prop) => renderPropertyItem(prop))}
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: { ...Typography.h5, fontWeight: '700' },
  desc: { ...Typography.caption },
  toggleGrid: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 6,
  },
  toggleLabel: {
    ...Typography.body,
    flex: 1,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  fieldBlock: { gap: 6 },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { ...Typography.small, fontWeight: '600' },
  err: {
    ...Typography.caption,
    marginTop: -2,
  },
});
