import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PostField } from './PostField';
import {
  isFarrierListing,
  isPansiyonListing,
  isStudServiceListing,
  isTransportListing,
  type ListingFieldErrors,
} from '@/services/listing';
import {
  COAT_COLOR_OPTIONS,
  STUD_AGE_OPTIONS,
  STUD_BREED_OPTIONS,
} from '@/components/listings/filterConfig';
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
    catalogRepository
      .getCategoryFormDefinition(catId)
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

    return () => {
      cancelled = true;
    };
  }, [type?.categoryId, type?.categorySlug]);

  const customProperties = useMemo(() => {
    if (!categoryProperties || categoryProperties.length === 0) return [];
    return categoryProperties.filter((prop) => {
      const codeUpper = (prop.code || '').toUpperCase();
      if (
        codeUpper === 'HORSE_BREED' ||
        codeUpper === 'STALLION_BREED' ||
        codeUpper === 'COAT_COLOR' ||
        codeUpper === 'HORSE_AGE' ||
        codeUpper === 'STALLION_AGE' ||
        codeUpper === 'HORSE_GENDER' ||
        codeUpper === 'GRASS_PADDOCK' ||
        codeUpper === 'GRASSPADDOCK' ||
        codeUpper === 'SAND_PADDOCK' ||
        codeUpper === 'SANDPADDOCK' ||
        codeUpper === 'STALLION_PADDOCK' ||
        codeUpper === 'STALLIONPADDOCK' ||
        codeUpper === 'VET' ||
        codeUpper === 'VET_SERVICE' ||
        codeUpper === 'FARRIER' ||
        codeUpper === 'FARRIER_SERVICE' ||
        codeUpper === 'FOALING_BARN' ||
        codeUpper === 'FOALINGBARN' ||
        codeUpper === 'COMPANY_NAME' ||
        codeUpper === 'WEBSITE_URL'
      ) {
        return false;
      }
      return true;
    });
  }, [categoryProperties]);

  const renderCustomPropertiesCard = () => {
    if (customProperties.length === 0) return null;

    return (
      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) =>
          onLayoutSection?.('customProperties', e.nativeEvent.layout.y)
        }
      >
        <Text style={[styles.section, { color: text }]}>
          Kategoriye Özel Ek Bilgiler
        </Text>
        <Text style={[styles.desc, { color: secondary }]}>
          Bu kategori için tanımlanmış ek özellikleri girin.
        </Text>

        {customProperties.map((prop) => {
          const propKey = prop.code || prop.title;
          const currentProps = d.properties || {};
          const val = currentProps[propKey];

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
                    const on = String(val ?? '') === optVal;
                    return (
                      <Pressable
                        key={optVal}
                        onPress={() =>
                          onUpdate({
                            properties: {
                              ...currentProps,
                              [propKey]: optVal,
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
              value={String(val ?? '')}
              onChangeText={(textVal) =>
                onUpdate({
                  properties: {
                    ...currentProps,
                    [propKey]: textVal,
                  },
                })
              }
              placeholder={prop.helpText || `${prop.title} girin`}
              keyboardType={isNumeric ? 'numeric' : 'default'}
            />
          );
        })}
      </View>
    );
  };

  // 1. Pansiyon Haralar
  if (isPansiyonListing(type)) {
    return (
      <>
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) => onLayoutSection?.('facilities', e.nativeEvent.layout.y)}
        >
          <Text style={[styles.section, { color: text }]}>
            Tesis & Hizmet Bilgileri
            <Text style={{ color: errorColor }}> *</Text>
          </Text>
          <Text style={[styles.desc, { color: secondary }]}>
            Tesisinizde sağladığınız padok, bakım ve hizmet olanaklarını belirtin (en az 1 özellik seçilmelidir).
          </Text>

          <View style={styles.toggleGrid}>
            <ToggleItem
              label="Çim Padok"
              value={Boolean(d.facilityGrassPaddock)}
              onToggle={() =>
                onUpdate({ facilityGrassPaddock: !d.facilityGrassPaddock })
              }
            />
            <ToggleItem
              label="Kum Padok"
              value={Boolean(d.facilitySandPaddock)}
              onToggle={() =>
                onUpdate({ facilitySandPaddock: !d.facilitySandPaddock })
              }
            />
            <ToggleItem
              label="Aygır Padoğu"
              value={Boolean(d.facilityStallionPaddock)}
              onToggle={() =>
                onUpdate({ facilityStallionPaddock: !d.facilityStallionPaddock })
              }
            />
            <ToggleItem
              label="Veteriner"
              value={Boolean(d.facilityVeterinarian)}
              onToggle={() =>
                onUpdate({ facilityVeterinarian: !d.facilityVeterinarian })
              }
            />
            <ToggleItem
              label="Nalbant"
              value={Boolean(d.facilityFarrier)}
              onToggle={() =>
                onUpdate({ facilityFarrier: !d.facilityFarrier })
              }
            />
            <ToggleItem
              label="Doğumhane"
              value={Boolean(d.facilityFoalingBarn)}
              onToggle={() =>
                onUpdate({ facilityFoalingBarn: !d.facilityFoalingBarn })
              }
            />
          </View>

          {errors.facility ? (
            <Text style={[styles.err, { color: errorColor }]}>{errors.facility}</Text>
          ) : null}

          <PostField
            label="İdman Pisti"
            value={d.facilityTrainingTrack ?? ''}
            onChangeText={(facilityTrainingTrack) =>
              onUpdate({ facilityTrainingTrack })
            }
            placeholder="Örn: 1200m Kum Pist, Sentetik Pist..."
            hint="Mevcut idman pisti özelliklerini ve uzunluğunu yazabilirsiniz."
          />
        </View>
        {renderCustomPropertiesCard()}
      </>
    );
  }

  // 2. At Nakliyesi
  if (isTransportListing(type)) {
    return (
      <>
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) => onLayoutSection?.('transport', e.nativeEvent.layout.y)}
        >
          <Text style={[styles.section, { color: text }]}>
            Firma ve Hizmet Bilgileri
          </Text>
          <Text style={[styles.desc, { color: secondary }]}>
            Nakliye firmanız ve hizmet detaylarınızı eksiksiz tamamlayın.
          </Text>

          <PostField
            label="Firma Adı"
            required
            value={d.companyName ?? ''}
            onChangeText={(companyName) => onUpdate({ companyName })}
            placeholder="Örn: Anadolu At Taşımacılığı Ltd."
            error={errors.companyName}
          />

          <PostField
            label="Web Sitesi"
            value={d.websiteUrl ?? ''}
            onChangeText={(websiteUrl) => onUpdate({ websiteUrl })}
            placeholder="https://www.firmaadi.com"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {renderCustomPropertiesCard()}
      </>
    );
  }

  // 3. Aşım Hizmetleri (Arap / İngiliz)
  if (isStudServiceListing(type)) {
    return (
      <>
        {/* At Bilgileri */}
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) => onLayoutSection?.('studInfo', e.nativeEvent.layout.y)}
        >
          <Text style={[styles.section, { color: text }]}>At Bilgileri</Text>
          <Text style={[styles.desc, { color: secondary }]}>
            Aşım hizmeti sunulan aygırın ırk, yaş ve don bilgilerini eksiksiz girin.
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: secondary }]}>
              At Irkı
              <Text style={{ color: errorColor }}> *</Text>
            </Text>
            <View style={styles.chips}>
              {STUD_BREED_OPTIONS.map((breed) => {
                const on =
                  (d.studBreed ?? '').toLocaleLowerCase('tr') ===
                  breed.toLocaleLowerCase('tr');
                return (
                  <Pressable
                    key={breed}
                    onPress={() => onUpdate({ studBreed: breed })}
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
                      {breed}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.studBreed ? (
              <Text style={[styles.err, { color: errorColor }]}>{errors.studBreed}</Text>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: secondary }]}>
              Yaş
              <Text style={{ color: errorColor }}> *</Text>
            </Text>
            <View style={styles.chips}>
              {STUD_AGE_OPTIONS.map((ageVal) => {
                const on =
                  (d.studAge || d.age || '') === ageVal;
                return (
                  <Pressable
                    key={ageVal}
                    onPress={() =>
                      onUpdate({ studAge: ageVal, age: ageVal })
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
                      {ageVal}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <PostField
            label="Yaş (Doğrudan Giriş)"
            required
            value={d.studAge || d.age || ''}
            onChangeText={(studAge) => onUpdate({ studAge, age: studAge })}
            placeholder="Örn: 5"
            keyboardType="numeric"
            error={errors.studAge}
          />

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: secondary }]}>
              Donu (Renk)
              <Text style={{ color: errorColor }}> *</Text>
            </Text>
            <View style={styles.chips}>
              {COAT_COLOR_OPTIONS.map((color) => {
                const on =
                  (d.studCoatColor || d.coatColor || '').toLocaleLowerCase('tr') ===
                  color.toLocaleLowerCase('tr');
                return (
                  <Pressable
                    key={color}
                    onPress={() =>
                      onUpdate({ studCoatColor: color, coatColor: color })
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
                      {color}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.studCoatColor ? (
              <Text style={[styles.err, { color: errorColor }]}>{errors.studCoatColor}</Text>
            ) : null}
          </View>
        </View>

        {/* Soy Kütüğü (Pedigree) */}
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) =>
            onLayoutSection?.('studPedigree', e.nativeEvent.layout.y)
          }
        >
          <Text style={[styles.section, { color: text }]}>
            Soy Kütüğü (Pedigree)
          </Text>
          <Text style={[styles.desc, { color: secondary }]}>
            Aygırın soy kütüğü / at, baba, anne ve annesinin babası bilgileri zorunludur.
          </Text>

          <PostField
            label="At / Aygır Adı"
            required
            value={d.registeredName || (d.studHorseName ?? '')}
            onChangeText={(val) =>
              onUpdate({ registeredName: val, studHorseName: val })
            }
            placeholder="Atın adı"
            error={errors.studHorseName || errors.registeredName}
          />

          <PostField
            label="Baba"
            required
            value={d.studSire || d.sire || ''}
            onChangeText={(studSire) => onUpdate({ studSire, sire: studSire })}
            placeholder="Baba adı"
            error={errors.studSire}
          />

          <PostField
            label="Anne"
            required
            value={d.studDam || d.dam || ''}
            onChangeText={(studDam) => onUpdate({ studDam, dam: studDam })}
            placeholder="Anne adı"
            error={errors.studDam}
          />

          <PostField
            label="Annesinin Babası"
            required
            value={d.studDamsire || d.damsire || ''}
            onChangeText={(studDamsire) =>
              onUpdate({ studDamsire, damsire: studDamsire })
            }
            placeholder="Annesinin babası"
            error={errors.studDamsire}
          />
        </View>
        {renderCustomPropertiesCard()}
      </>
    );
  }

  // 4. Diğer / Standart Satılık Atlar & Nalbantlar
  return renderCustomPropertiesCard();
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
