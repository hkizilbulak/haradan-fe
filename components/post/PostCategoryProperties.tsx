import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PostField } from './PostField';
import { catalogRepository } from '@/services/catalog';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryPropertyPublic } from '@/types';
import type { ListingDraft, ListingDraftDetails } from '@/types/listing';
import { setListingWizardState, type ListingFieldErrors } from '@/services/listing';

type PostCategoryPropertiesProps = {
  draft: ListingDraft;
  onUpdate: (partial: Partial<ListingDraftDetails>) => void;
  errors?: ListingFieldErrors;
  onLayoutSection?: (key: string, y: number) => void;
  onPropertiesLoaded?: (props: CategoryPropertyPublic[]) => void;
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
  onPropertiesLoaded,
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
  const onPropertiesLoadedRef = useRef(onPropertiesLoaded);
  onPropertiesLoadedRef.current = onPropertiesLoaded;

  useEffect(() => {
    const catId = type?.categoryId || type?.categorySlug;
    if (
      !catId ||
      catId === 'ortak-alanlar' ||
      catId === 'cat-ortak-alanlar' ||
      catId === 'c1000000-0000-4000-8000-000000000000' ||
      type?.categorySlug === 'ortak-alanlar'
    ) {
      setCategoryProperties([]);
      onPropertiesLoadedRef.current?.([]);
      return;
    }
    let cancelled = false;

    const GLOBAL_CODES = new Set([
      'ADDRESS',
      'DESCRIPTION',
      'PRICE',
      'LOCATION',
      'PHONE',
      'TITLE',
      'MEDIA',
      'IMAGES',
    ]);

    const loadProps = () => {
      catalogRepository
        .getCategoryFormDefinition(catId, {
          fresh: true,
          categorySlug: type?.categorySlug,
        } as any)
        .then((def) => {
          if (cancelled) return;
          if (def && Array.isArray(def.properties)) {
            const filtered = def.properties.filter(
              (p: any) =>
                p.isActive !== false &&
                !GLOBAL_CODES.has(String(p.code || '').toUpperCase())
            );
            setCategoryProperties(filtered);
            setListingWizardState({ categoryProperties: filtered });
            onPropertiesLoadedRef.current?.(filtered);
          } else {
            setCategoryProperties([]);
            setListingWizardState({ categoryProperties: [] });
            onPropertiesLoadedRef.current?.([]);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCategoryProperties([]);
            setListingWizardState({ categoryProperties: [] });
            onPropertiesLoadedRef.current?.([]);
          }
        });
    };

    loadProps();

    if (typeof window !== 'undefined') {
      window.addEventListener('haradan_category_properties_changed', loadProps);
      window.addEventListener('storage', loadProps);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('haradan_category_properties_changed', loadProps);
        window.removeEventListener('storage', loadProps);
      }
    };
  }, [type?.categoryId, type?.categorySlug]);

  const handlePropertyChange = (code: string, value: unknown) => {
    const currentProps = { ...(d.properties || {}) };
    if (value === undefined || value === null || value === '') {
      delete currentProps[code];
    } else {
      currentProps[code] = value;
    }
    // Clean up any potential duplicate casing keys
    const codeUpper = code.toUpperCase();
    const codeLower = code.toLowerCase();
    if (codeUpper !== code) delete currentProps[codeUpper];
    if (codeLower !== code) delete currentProps[codeLower];

    const partialUpdate: Partial<ListingDraftDetails> = {
      properties: currentProps,
    };

    // Keep legacy / top-level details fields in sync if applicable
    if (codeUpper === 'HORSE_BREED' || codeUpper === 'BREED') {
      partialUpdate.breed = String(value ?? '');
    } else if (codeUpper === 'COAT_COLOR' || codeUpper === 'COATCOLOR') {
      partialUpdate.coatColor = String(value ?? '');
    } else if (codeUpper === 'HORSE_AGE' || codeUpper === 'AGE') {
      partialUpdate.age = String(value ?? '');
    } else if (codeUpper === 'HORSE_GENDER' || codeUpper === 'GENDER') {
      partialUpdate.gender = value as any;
    } else if (code === 'grassPaddock') {
      partialUpdate.facilityGrassPaddock = Boolean(value);
    } else if (code === 'sandPaddock') {
      partialUpdate.facilitySandPaddock = Boolean(value);
    } else if (code === 'stallionPaddock') {
      partialUpdate.facilityStallionPaddock = Boolean(value);
    } else if (code === 'vet') {
      partialUpdate.facilityVeterinarian = Boolean(value);
    } else if (code === 'farrier') {
      partialUpdate.facilityFarrier = Boolean(value);
    } else if (code === 'foalingBarn') {
      partialUpdate.facilityFoalingBarn = Boolean(value);
    } else if (code === 'COMPANY_NAME' || code === 'companyName') {
      partialUpdate.companyName = String(value ?? '');
    } else if (code === 'WEBSITE_URL' || code === 'websiteUrl') {
      partialUpdate.websiteUrl = String(value ?? '');
    } else if (code === 'STALLION_BREED' || code === 'studBreed') {
      partialUpdate.studBreed = String(value ?? '');
    } else if (code === 'STALLION_AGE' || code === 'studAge') {
      partialUpdate.studAge = String(value ?? '');
    } else if (code === 'studHorseName') {
      partialUpdate.studHorseName = String(value ?? '');
    } else if (code === 'studSire') {
      partialUpdate.studSire = String(value ?? '');
    } else if (code === 'studDam') {
      partialUpdate.studDam = String(value ?? '');
    } else if (code === 'studDamsire') {
      partialUpdate.studDamsire = String(value ?? '');
    } else if (code === 'serviceType' || code === 'service_type' || codeUpper === 'SERVICE_TYPE') {
      (partialUpdate as any).serviceType = String(value ?? '');
    }

    onUpdate(partialUpdate);
  };

  const getPropertyValue = (code: string): unknown => {
    if (d.properties) {
      if (d.properties[code] !== undefined && d.properties[code] !== '') {
        return d.properties[code];
      }
      const normTarget = code.replace(/[-_]/g, '').toLowerCase();
      for (const [k, v] of Object.entries(d.properties)) {
        if (k.replace(/[-_]/g, '').toLowerCase() === normTarget && v !== undefined && v !== '') {
          return v;
        }
      }
    }
    const codeUpper = code.toUpperCase();
    if (codeUpper === 'HORSE_BREED' && d.breed) return d.breed;
    if (codeUpper === 'COAT_COLOR' && d.coatColor) return d.coatColor;
    if (codeUpper === 'HORSE_AGE' && d.age) return d.age;
    if (codeUpper === 'HORSE_GENDER' && d.gender) return d.gender;
    if (code === 'grassPaddock' && d.facilityGrassPaddock !== undefined) return d.facilityGrassPaddock;
    if (code === 'sandPaddock' && d.facilitySandPaddock !== undefined) return d.facilitySandPaddock;
    if (code === 'stallionPaddock' && d.facilityStallionPaddock !== undefined) return d.facilityStallionPaddock;
    if (code === 'vet' && d.facilityVeterinarian !== undefined) return d.facilityVeterinarian;
    if (code === 'farrier' && d.facilityFarrier !== undefined) return d.facilityFarrier;
    if (code === 'foalingBarn' && d.facilityFoalingBarn !== undefined) return d.facilityFoalingBarn;
    if ((code === 'COMPANY_NAME' || code === 'companyName') && d.companyName) return d.companyName;
    if ((code === 'WEBSITE_URL' || code === 'websiteUrl') && d.websiteUrl) return d.websiteUrl;
    if ((code === 'STALLION_BREED' || code === 'studBreed') && d.studBreed) return d.studBreed;
    if ((code === 'STALLION_AGE' || code === 'studAge') && d.studAge) return d.studAge;
    if (code === 'studHorseName' && d.studHorseName) return d.studHorseName;
    if (code === 'studSire' && d.studSire) return d.studSire;
    if (code === 'studDam' && d.studDam) return d.studDam;
    if (code === 'studDamsire' && d.studDamsire) return d.studDamsire;
    return undefined;
  };

  // Group properties into toggles vs chips/inputs
  const { toggleProps, otherProps } = useMemo(() => {
    const toggles: CategoryPropertyPublic[] = [];
    const others: CategoryPropertyPublic[] = [];

    for (const prop of categoryProperties) {
      if (prop.dataType === 'BOOLEAN') {
        toggles.push(prop);
      } else {
        others.push(prop);
      }
    }

    return { toggleProps: toggles, otherProps: others };
  }, [categoryProperties]);

  if (categoryProperties.length === 0) {
    return null;
  }

  const categoryTitle = type?.categoryName
    ? `${type.categoryName} Özellikleri ve Bilgileri`
    : 'Kategori Özellikleri';

  return (
    <View
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onLayout={(e) =>
        onLayoutSection?.('categoryProperties', e.nativeEvent.layout.y)
      }
    >
      <Text style={[styles.section, { color: text }]}>{categoryTitle}</Text>
      <Text style={[styles.desc, { color: secondary }]}>
        Seçtiğiniz kategoriye özel alanları ve özellikleri eksiksiz doldurunuz.
      </Text>

      {/* 1. Chips and Input Fields */}
      {otherProps.map((prop) => {
        const propKey = prop.code;
        const val = getPropertyValue(prop.code);
        const err = errors[prop.code as keyof ListingFieldErrors];

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
                    String(val ?? '').toLocaleLowerCase('tr') ===
                      optVal.toLocaleLowerCase('tr') ||
                    String(val ?? '').toLocaleLowerCase('tr') ===
                      (opt.value || '').toLocaleLowerCase('tr') ||
                    String(val ?? '').toLocaleLowerCase('tr') ===
                      (opt.label || '').toLocaleLowerCase('tr');

                  return (
                    <Pressable
                      key={optVal}
                      onPress={() => {
                        if (on && prop.isRequired) {
                          return;
                        }
                        handlePropertyChange(
                          prop.code,
                          on ? undefined : opt.value || optVal
                        );
                      }}
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
              {err ? (
                <Text style={[styles.err, { color: errorColor }]}>{err}</Text>
              ) : null}
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
              handlePropertyChange(prop.code, finalVal);
            }}
            placeholder={prop.helpText || `${prop.title} girin`}
            keyboardType={isNumeric ? 'numeric' : 'default'}
            error={err}
          />
        );
      })}

      {/* 2. Boolean Toggle Grid */}
      {toggleProps.length > 0 ? (
        <View style={styles.toggleSection}>
          <Text style={[styles.fieldLabel, { color: secondary, marginBottom: 4 }]}>
            Olanaklar & Hizmet Özellikleri
          </Text>
          <View style={styles.toggleGrid}>
            {toggleProps.map((prop) => {
              const val = Boolean(getPropertyValue(prop.code));
              return (
                <ToggleItem
                  key={prop.code}
                  label={prop.title}
                  value={val}
                  onToggle={() => handlePropertyChange(prop.code, !val)}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.md,
  },
  section: {
    ...Typography.h5,
    fontWeight: '700',
  },
  desc: {
    ...Typography.caption,
    marginTop: -4,
    marginBottom: 4,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  toggleSection: {
    gap: 6,
    marginTop: 4,
  },
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    minWidth: '47%',
    flex: 1,
  },
  toggleLabel: {
    ...Typography.caption,
    flex: 1,
    marginRight: 8,
  },
  switch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  err: {
    ...Typography.caption,
    marginTop: 2,
  },
});
