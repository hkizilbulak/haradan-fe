import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatTlInput,
  parseTlInput,
  priceHint,
  PERIOD_OPTIONS,
  periodLabel,
  isPansiyonCategory,
  type ListingPeriodFilter,
  type PansiyonFacilityKey,
} from '@/components/listings/filterConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup } from '@/services/location';
import { catalogRepository } from '@/services/catalog';
import { useDistricts, useProvinces } from '@/hooks/useLocation';
import type {
  CatalogFacetGroup,
  CatalogFacetOption,
  CatalogFacets,
  CategoryPropertyPublic,
} from '@/types';


if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type PansiyonFacilityFilters = Partial<Record<PansiyonFacilityKey, boolean>>;

export type ListingsFiltersState = {
  categorySlug: string | null;
  breed: string | null;
  urgentOnly: boolean;
  provinceIds: string[];
  districtId: string | null;
  priceMinTl: number | null;
  priceMaxTl: number | null;
  period: ListingPeriodFilter | null;
  facilities: PansiyonFacilityFilters;
  breeds: string[];
  ages: string[];
  colors: string[];
  genders?: string[];
  features?: string[];
};

type ListingsFilterSidebarProps = {
  facets: CatalogFacets | null;
  value: ListingsFiltersState;
  onChange: (next: ListingsFiltersState) => void;
  resultCount: number;
};

export {
  PANSIYON_FACILITY_OPTIONS as FACILITY_OPTIONS,
  HORSE_BREED_OPTIONS,
  HORSE_AGE_OPTIONS,
  HORSE_GENDER_OPTIONS,
  STUD_BREED_OPTIONS,
  STUD_AGE_OPTIONS,
  COAT_COLOR_OPTIONS,
} from './filterConfig';

function toggleAnim() {
  if (Platform.OS === 'web') return;
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function Radio({ on, color, border }: { on: boolean; color: string; border: string }) {
  return (
    <View
      style={[
        styles.radio,
        { borderColor: on ? color : border, backgroundColor: on ? color : 'transparent' },
      ]}
    >
      {on ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

function Check({ on, color, border }: { on: boolean; color: string; border: string }) {
  return (
    <View
      style={[
        styles.check,
        { borderColor: on ? color : border, backgroundColor: on ? color : 'transparent' },
      ]}
    >
      {on ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
    </View>
  );
}

type AccordionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  hint?: string | null;
  children: React.ReactNode;
  text: string;
  textMuted: string;
  border: string;
};

function Accordion({
  title,
  open,
  onToggle,
  hint,
  children,
  text,
  textMuted,
  border,
}: AccordionProps) {
  return (
    <View style={[styles.section, { borderBottomColor: border }]}>
      <Pressable
        onPress={() => {
          toggleAnim();
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        {...(Platform.OS === 'web' ? ({ focusable: false } as object) : null)}
        style={({ pressed }) => [styles.sectionHead, { opacity: pressed ? 0.55 : 1 }]}
      >
        <Text style={[styles.sectionTitle, { color: text }]}>{title}</Text>
        {!open && hint ? (
          <Text style={[styles.hint, { color: textMuted }]} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
        <Ionicons name={open ? 'remove' : 'add'} size={16} color={textMuted} />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

type RowProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  indent?: boolean;
  depth?: number;
  multi?: boolean;
  text: string;
  textMuted: string;
  textSecondary: string;
  header: string;
  border: string;
};

function FilterRow({
  label,
  selected,
  onSelect,
  expandable,
  expanded,
  onToggle,
  indent,
  depth = 0,
  multi,
  text,
  textMuted,
  textSecondary,
  header,
  border,
}: RowProps) {
  const dynamicIndent = depth > 0 ? (depth === 1 ? 16 : 16 + (depth - 1) * 14) : 0;
  return (
    <View
      style={[
        styles.row,
        indent && styles.rowIndent,
        depth > 0 && { paddingLeft: dynamicIndent },
      ]}
    >

      <Pressable
        onPress={onSelect}
        hitSlop={6}
        accessibilityRole={multi ? 'checkbox' : 'radio'}
        accessibilityState={{ checked: selected, selected }}
        {...(Platform.OS === 'web' ? ({ focusable: false } as object) : null)}
        style={styles.radioHit}
      >
        {multi ? (
          <Check on={selected} color={header} border={border} />
        ) : (
          <Radio on={selected} color={header} border={border} />
        )}
      </Pressable>
      <Pressable
        onPress={expandable ? onToggle : onSelect}
        {...(Platform.OS === 'web' ? ({ focusable: false } as object) : null)}
        style={({ pressed }) => [styles.rowLabel, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text
          style={[
            styles.rowText,
            {
              color: selected ? text : textSecondary,
              fontWeight: selected ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
      {expandable ? (
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityLabel={expanded ? 'Kapat' : 'Aç'}
          {...(Platform.OS === 'web' ? ({ focusable: false } as object) : null)}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={textMuted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export const EMPTY_LISTINGS_FILTERS: ListingsFiltersState = {
  categorySlug: null,
  breed: null,
  urgentOnly: false,
  provinceIds: [],
  districtId: null,
  priceMinTl: null,
  priceMaxTl: null,
  period: null,
  facilities: {},
  breeds: [],
  ages: [],
  colors: [],
  genders: [],
  features: [],
};

function isBreedProperty(p: CategoryPropertyPublic): boolean {
  const c = (p.code || p.title || '').toLocaleLowerCase('tr');
  return (
    c.includes('irk') ||
    c.includes('ırk') ||
    c.includes('breed') ||
    c === 'horse_breed' ||
    c === 'stallion_breed'
  );
}

function isColorProperty(p: CategoryPropertyPublic): boolean {
  const c = (p.code || p.title || '').toLocaleLowerCase('tr');
  return (
    c.includes('don') ||
    c.includes('renk') ||
    c.includes('color') ||
    c === 'coat_color' ||
    c === 'coat'
  );
}

function isAgeProperty(p: CategoryPropertyPublic): boolean {
  const c = (p.code || p.title || '').toLocaleLowerCase('tr');
  return (
    c.includes('yaş') ||
    c.includes('yas') ||
    c.includes('age') ||
    c === 'horse_age' ||
    c === 'stallion_age'
  );
}

function isGenderProperty(p: CategoryPropertyPublic): boolean {
  const c = (p.code || p.title || '').toLocaleLowerCase('tr');
  return (
    c.includes('cinsiyet') ||
    c.includes('gender') ||
    c.includes('sex') ||
    c === 'horse_gender'
  );
}

/** Sol filtre — kapalı akordeon; detay basınca açılır. */
export const ListingsFilterSidebar = memo(function ListingsFilterSidebar({
  facets,
  value,
  onChange,
  resultCount,
}: ListingsFilterSidebarProps) {
  const groups = useMemo(() => facets?.groups ?? [], [facets?.groups]);
  const { items: provinces } = useProvinces();
  const selectedProvinceId =
    value.provinceIds.length === 1 ? value.provinceIds[0] : null;
  const { items: districts } = useDistricts(selectedProvinceId);

  const isPansiyonActive = isPansiyonCategory(value.categorySlug);

  const [categoryProperties, setCategoryProperties] = useState<CategoryPropertyPublic[]>([]);

  useEffect(() => {
    if (!value.categorySlug) {
      setCategoryProperties([]);
      return;
    }
    let cancelled = false;
    let categoryId = '';
    const walk = (opts: CatalogFacetOption[]) => {
      for (const o of opts) {
        if (o.slug === value.categorySlug) {
          categoryId = o.id;
          return;
        }
        walk(o.children);
      }
    };
    groups.forEach((g) => walk(g.options));

    const loadProps = () => {
      catalogRepository
        .getCategoryFormDefinition(categoryId || value.categorySlug!, {
          fresh: true,
          categorySlug: value.categorySlug!,
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
          if (!cancelled) {
            setCategoryProperties([]);
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
  }, [value.categorySlug, groups]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'listing-type': true,
    'horse-breeds': true,
    'horse-ages': true,
    'horse-colors': true,
    'horse-genders': true,
    facilities: true,
    'stud-breeds': true,
    'stud-ages': true,
    'stud-colors': true,
    period: true,
    advanced: false,
  });

  const [openOptions, setOpenOptions] = useState<Record<string, boolean>>({});
  const [cityQuery, setCityQuery] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [minText, setMinText] = useState(formatTlInput(value.priceMinTl));
  const [maxText, setMaxText] = useState(formatTlInput(value.priceMaxTl));

  useEffect(() => {
    setMinText(formatTlInput(value.priceMinTl));
    setMaxText(formatTlInput(value.priceMaxTl));
  }, [value.priceMinTl, value.priceMaxTl]);

  useEffect(() => {
    if (groups.length === 0) return;
    const hasAdvanced =
      value.provinceIds.length > 0 ||
      value.districtId != null ||
      value.priceMinTl != null ||
      value.priceMaxTl != null ||
      value.urgentOnly;
    if (hasAdvanced) {
      setOpenGroups((p) => ({ ...p, advanced: true }));
    }
    if (!value.categorySlug) return;

    const nextOptions: Record<string, boolean> = {};
    const hasDescendant = (opt: CatalogFacetOption, targetSlug: string): boolean => {
      return (
        opt.children.some((c) => c.slug === targetSlug) ||
        opt.children.some((c) => hasDescendant(c, targetSlug))
      );
    };

    const walkTree = (opts: CatalogFacetOption[]) => {
      opts.forEach((o) => {
        if (
          o.slug === value.categorySlug ||
          hasDescendant(o, value.categorySlug!)
        ) {
          nextOptions[o.id] = true;
        }
        if (o.children && o.children.length > 0) {
          walkTree(o.children);
        }
      });
    };

    groups.forEach((g) => walkTree(g.options));
    setOpenOptions((prev) => ({ ...prev, ...nextOptions }));
  }, [
    groups,
    value.categorySlug,
    value.provinceIds,
    value.districtId,
    value.priceMinTl,
    value.priceMaxTl,
    value.urgentOnly,
  ]);


  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const slugLabels = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (opts: CatalogFacetOption[]) => {
      opts.forEach((o) => {
        map.set(o.slug, o.label);
        walk(o.children);
      });
    };
    groups.forEach((g) => walk(g.options));
    return map;
  }, [groups]);

  const activeCategoryProperties = useMemo(() => {
    if (!value.categorySlug) return [];
    return categoryProperties
      .filter((p: any) => {
        if (
          p.isActive === false ||
          p.is_active === false ||
          p.active === false ||
          p.isFilterable === false ||
          p.is_filterable === false
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));
  }, [value.categorySlug, categoryProperties]);

  const booleanProps = useMemo(() => {
    return activeCategoryProperties.filter((p) => p.dataType === 'BOOLEAN');
  }, [activeCategoryProperties]);

  const selectProps = useMemo(() => {
    return activeCategoryProperties.filter(
      (p) => p.dataType === 'SINGLE_SELECT' || (p.options && p.options.length > 0)
    );
  }, [activeCategoryProperties]);

  const otherProps = useMemo(() => {
    return activeCategoryProperties.filter(
      (p) =>
        p.dataType !== 'BOOLEAN' &&
        p.dataType !== 'SINGLE_SELECT' &&
        (!p.options || p.options.length === 0)
    );
  }, [activeCategoryProperties]);

  const hasActive =
    value.categorySlug != null ||
    value.breed != null ||
    value.urgentOnly ||
    value.provinceIds.length > 0 ||
    value.districtId != null ||
    value.priceMinTl != null ||
    value.priceMaxTl != null ||
    value.period != null ||
    (value.breeds && value.breeds.length > 0) ||
    (value.ages && value.ages.length > 0) ||
    (value.colors && value.colors.length > 0) ||
    (value.genders && value.genders.length > 0) ||
    (value.features && value.features.length > 0) ||
    Object.values(value.facilities ?? {}).some(Boolean);

  const advancedHint =
    [
      value.provinceIds.length === 1
        ? locationLookup.getProvinceName(value.provinceIds[0])
        : value.provinceIds.length > 1
          ? `${locationLookup.getProvinceName(value.provinceIds[0])} +${value.provinceIds.length - 1}`
          : null,
      value.districtId ? locationLookup.getDistrictName(value.districtId) : null,
      priceHint(value.priceMinTl, value.priceMaxTl),
      value.urgentOnly ? 'Acil' : null,
    ]
      .filter(Boolean)
      .join(' · ') || null;

  const filteredProvinces = useMemo(() => {
    const needle = cityQuery.trim().toLocaleLowerCase('tr');
    if (!needle) return provinces;
    return provinces.filter((p) =>
      p.name.toLocaleLowerCase('tr').includes(needle)
    );
  }, [cityQuery, provinces]);

  const filteredDistricts = useMemo(() => {
    const needle = districtQuery.trim().toLocaleLowerCase('tr');
    if (!needle) return districts;
    return districts.filter((d) =>
      d.name.toLocaleLowerCase('tr').includes(needle)
    );
  }, [districtQuery, districts]);

  const commitPrice = (minRaw: string, maxRaw: string) => {
    onChange({
      ...value,
      priceMinTl: parseTlInput(minRaw),
      priceMaxTl: parseTlInput(maxRaw),
    });
  };

  const onMinChange = (raw: string) => {
    const n = parseTlInput(raw);
    const next = n == null ? '' : formatTlInput(n);
    setMinText(next);
    commitPrice(next, maxText);
  };

  const onMaxChange = (raw: string) => {
    const n = parseTlInput(raw);
    const next = n == null ? '' : formatTlInput(n);
    setMaxText(next);
    commitPrice(minText, next);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((p) => ({ ...p, [id]: !p[id] }));
  };

  const applyOption = (group: CatalogFacetGroup, option: CatalogFacetOption) => {
    if (group.kind === 'breed') {
      onChange({
        ...value,
        breed: value.breed === option.slug ? null : option.slug,
      });
      return;
    }
    if (group.kind === 'status') {
      onChange({ ...value, urgentOnly: !value.urgentOnly });
      return;
    }
    onChange({
      ...value,
      categorySlug: value.categorySlug === option.slug ? null : option.slug,
    });
  };

  const isOptionActive = (
    group: CatalogFacetGroup,
    option: CatalogFacetOption
  ): boolean => {
    if (group.kind === 'breed') return value.breed === option.slug;
    if (group.kind === 'status') {
      return option.slug === 'urgent' && value.urgentOnly;
    }
    return value.categorySlug === option.slug;
  };

  const rowTheme = {
    text,
    textMuted,
    textSecondary,
    header,
    border,
  };

  const categoryGroup = groups.find((g) => g.kind === 'category');

  const facilityCount = Object.values(value.facilities ?? {}).filter(Boolean).length;
  const facilityHint = facilityCount > 0 ? `${facilityCount} seçili` : null;

  return (
    <View
      nativeID="haradan-listings-filters"
      style={[
        styles.wrap,
        Platform.OS === 'web' ? ({ overflowAnchor: 'none' } as object) : null,
      ]}
      {...(Platform.OS === 'web'
        ? ({ dataSet: { keepSearch: 'true' } } as object)
        : null)}
    >
      <View style={styles.head}>
        <Text style={[styles.title, { color: text }]}>Filtrele</Text>
        <View style={styles.headMeta}>
          <Text style={[styles.count, { color: textMuted }]}>{resultCount}</Text>
          <Pressable
            onPress={() => onChange(EMPTY_LISTINGS_FILTERS)}
            hitSlop={8}
            disabled={!hasActive}
            accessibilityLabel="Filtreleri sıfırla"
            style={({ pressed }) => ({
              opacity: !hasActive ? 0 : pressed ? 0.5 : 1,
            })}
          >
            <Text style={[styles.clear, { color: textMuted }]}>Temizle</Text>
          </Pressable>
        </View>
      </View>

      {/* 1. Kategori Seçimi (Her Zaman Görünür) */}
      {categoryGroup ? (
        <Accordion
          title={categoryGroup.label}
          open={!!openGroups[categoryGroup.id]}
          onToggle={() => toggleGroup(categoryGroup.id)}
          hint={
            value.categorySlug
              ? slugLabels.get(value.categorySlug)
              : null
          }
          text={text}
          textMuted={textMuted}
          border={border}
        >
          {(() => {
            const renderOption = (
              option: CatalogFacetOption,
              depth: number = 0
            ): React.ReactNode => {
              const hasKids = option.children && option.children.length > 0;
              const optionOpen = !!openOptions[option.id];
              const active = isOptionActive(categoryGroup, option);

              return (
                <View key={option.id}>
                  <FilterRow
                    label={option.label}
                    selected={active}
                    onSelect={() => applyOption(categoryGroup, option)}
                    expandable={hasKids}
                    expanded={optionOpen}
                    onToggle={() => {
                      toggleAnim();
                      setOpenOptions((p) => ({
                        ...p,
                        [option.id]: !optionOpen,
                      }));
                    }}
                    depth={depth}
                    {...rowTheme}
                  />
                  {hasKids && optionOpen
                    ? option.children.map((child) =>
                        renderOption(child, depth + 1)
                      )
                    : null}
                </View>
              );
            };

            return categoryGroup.options.map((option) =>
              renderOption(option, 0)
            );
          })()}
        </Accordion>
      ) : null}


      {/* 2. Detaylı Filtreleme (Konum, Fiyat, Acil - İlan Türünün Hemen Altında) */}
      <Accordion
        title="Detaylı filtreleme"
        open={!!openGroups.advanced}
        onToggle={() => toggleGroup('advanced')}
        hint={advancedHint}
        text={text}
        textMuted={textMuted}
        border={border}
      >
        <Text style={[styles.subLabel, { color: textMuted }]}>İl</Text>
        <View
          style={[
            styles.searchField,
            { borderColor: border, backgroundColor: surface },
          ]}
        >
          <Ionicons name="search-outline" size={14} color={textMuted} />
          <TextInput
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder="İl ara…"
            placeholderTextColor={textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[
              styles.searchInput,
              {
                color: text,
                ...(Platform.OS === 'web'
                  ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
                  : null),
              },
            ]}
          />
          {cityQuery.length > 0 ? (
            <Pressable onPress={() => setCityQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={14} color={textMuted} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          style={[styles.cityList, { borderColor: border }]}
          contentContainerStyle={styles.cityListContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {filteredProvinces.map((p) => (
            <FilterRow
              key={p.id}
              label={p.name}
              multi
              selected={value.provinceIds.includes(p.id)}
              onSelect={() => {
                const on = value.provinceIds.includes(p.id);
                onChange({
                  ...value,
                  provinceIds: on
                    ? value.provinceIds.filter((id) => id !== p.id)
                    : [...value.provinceIds, p.id],
                  districtId: on && value.districtId ? null : value.districtId,
                });
              }}
              {...rowTheme}
            />
          ))}
          {filteredProvinces.length === 0 ? (
            <Text style={[styles.emptyHint, { color: textMuted }]}>
              Eşleşen il yok
            </Text>
          ) : null}
        </ScrollView>

        {/* Seçili il için İlçe Listesi */}
        {selectedProvinceId && districts.length > 0 ? (
          <>
            <Text style={[styles.subLabel, styles.subSpaced, { color: textMuted }]}>
              İlçe
            </Text>
            <View
              style={[
                styles.searchField,
                { borderColor: border, backgroundColor: surface },
              ]}
            >
              <Ionicons name="search-outline" size={14} color={textMuted} />
              <TextInput
                value={districtQuery}
                onChangeText={setDistrictQuery}
                placeholder="İlçe ara…"
                placeholderTextColor={textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={[
                  styles.searchInput,
                  {
                    color: text,
                    ...(Platform.OS === 'web'
                      ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
                      : null),
                  },
                ]}
              />
              {districtQuery.length > 0 ? (
                <Pressable onPress={() => setDistrictQuery('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={14} color={textMuted} />
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              style={[styles.cityList, { borderColor: border }]}
              contentContainerStyle={styles.cityListContent}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <FilterRow
                label="Tüm ilçeler"
                selected={!value.districtId}
                onSelect={() => onChange({ ...value, districtId: null })}
                {...rowTheme}
              />
              {filteredDistricts.map((d) => (
                <FilterRow
                  key={d.id}
                  label={d.name}
                  selected={value.districtId === d.id}
                  onSelect={() =>
                    onChange({
                      ...value,
                      districtId: value.districtId === d.id ? null : d.id,
                    })
                  }
                  {...rowTheme}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text style={[styles.subLabel, styles.subSpaced, { color: textMuted }]}>
          Fiyat
        </Text>
        <View
          style={[
            styles.priceBox,
            { borderColor: border, backgroundColor: surface },
          ]}
        >
          <View style={styles.priceCell}>
            <Text style={[styles.priceLabel, { color: textMuted }]}>En az</Text>
            <View style={styles.priceValueRow}>
              <Text style={[styles.priceAffix, { color: textMuted }]}>₺</Text>
              <TextInput
                value={minText}
                onChangeText={onMinChange}
                placeholder="0"
                placeholderTextColor={textMuted}
                keyboardType="number-pad"
                inputMode="numeric"
                style={[
                  styles.priceInput,
                  {
                    color: text,
                    ...(Platform.OS === 'web'
                      ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
                      : null),
                  },
                ]}
              />
            </View>
          </View>
          <View style={[styles.priceSplit, { backgroundColor: border }]} />
          <View style={styles.priceCell}>
            <Text style={[styles.priceLabel, { color: textMuted }]}>En çok</Text>
            <View style={styles.priceValueRow}>
              <Text style={[styles.priceAffix, { color: textMuted }]}>₺</Text>
              <TextInput
                value={maxText}
                onChangeText={onMaxChange}
                placeholder="∞"
                placeholderTextColor={textMuted}
                keyboardType="number-pad"
                inputMode="numeric"
                style={[
                  styles.priceInput,
                  {
                    color: text,
                    ...(Platform.OS === 'web'
                      ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
                      : null),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.subLabel, styles.subSpaced, { color: textMuted }]}>
          Durum
        </Text>
        <Pressable
          onPress={() => onChange({ ...value, urgentOnly: !value.urgentOnly })}
          accessibilityRole="switch"
          accessibilityState={{ checked: value.urgentOnly }}
          style={({ pressed }) => [
            styles.toggleRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={[
              styles.rowText,
              {
                color: value.urgentOnly ? text : textSecondary,
                fontWeight: value.urgentOnly ? '600' : '400',
                flex: 1,
              },
            ]}
          >
            Yalnızca acil
          </Text>
          <View
            style={[
              styles.switch,
              {
                backgroundColor: value.urgentOnly ? header : border,
                justifyContent: value.urgentOnly ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            <View style={styles.switchKnob} />
          </View>
        </Pressable>
      </Accordion>

      {/* 3. DİNAMİK KATEGORİ FİLTRELERİ (BO'DAN YÖNETİLEN TÜM ÖZELLİKLER) */}
      {booleanProps.length > 0 ? (
        <Accordion
          title={isPansiyonActive ? 'Tesis / Hizmet Özellikleri' : 'Özellikler & Hizmetler'}
          open={openGroups.facilities ?? true}
          onToggle={() => toggleGroup('facilities')}
          hint={facilityHint}
          text={text}
          textMuted={textMuted}
          border={border}
        >
          {booleanProps.map((fac) => {
            const propKey = fac.code || fac.title;
            const on = Boolean(
              value.facilities?.[fac.code as PansiyonFacilityKey] ??
              value.facilities?.[propKey as PansiyonFacilityKey] ??
              (value.features ?? []).includes(propKey) ??
              (value.features ?? []).includes(fac.code) ??
              (value.features ?? []).includes(`${propKey}:true`) ??
              (value.features ?? []).includes(`${fac.code}:true`)
            );

            return (
              <Pressable
                key={propKey}
                onPress={() => {
                  const nextFacilities = {
                    ...value.facilities,
                    [fac.code as PansiyonFacilityKey]: !on,
                  };
                  const currFeatures = value.features ?? [];
                  const nextFeatures = on
                    ? currFeatures.filter(
                        (f) =>
                          f !== propKey &&
                          f !== fac.code &&
                          f !== `${propKey}:true` &&
                          f !== `${fac.code}:true`
                      )
                    : [...currFeatures, propKey];
                  onChange({
                    ...value,
                    facilities: nextFacilities,
                    features: nextFeatures,
                  });
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [
                  styles.toggleRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.rowText,
                    {
                      color: on ? text : textSecondary,
                      fontWeight: on ? '600' : '400',
                      flex: 1,
                    },
                  ]}
                >
                  {fac.title}
                </Text>
                <View
                  style={[
                    styles.switch,
                    {
                      backgroundColor: on ? header : border,
                      justifyContent: on ? 'flex-end' : 'flex-start',
                    },
                  ]}
                >
                  <View style={styles.switchKnob} />
                </View>
              </Pressable>
            );
          })}
        </Accordion>
      ) : null}

      {/* Seçenekli Alanlar (SINGLE_SELECT / Çoklu Seçim Checkbox Filtreleri) */}
      {selectProps.map((prop) => {
        const propKey = prop.code || prop.title;
        const isBreed = isBreedProperty(prop);
        const isColor = isColorProperty(prop);
        const isAge = isAgeProperty(prop);
        const isGender = isGenderProperty(prop);

        const isSelected = (optVal: string, optLabel?: string): boolean => {
          if (isBreed) {
            return (value.breeds ?? []).some((b) => b === optVal || (optLabel && b === optLabel));
          }
          if (isColor) {
            return (value.colors ?? []).some((c) => c === optVal || (optLabel && c === optLabel));
          }
          if (isAge) {
            return (value.ages ?? []).some((a) => a === optVal || (optLabel && a === optLabel));
          }
          if (isGender) {
            return (value.genders ?? []).some((g) => g === optVal || (optLabel && g === optLabel));
          }

          return (value.features ?? []).some(
            (f) =>
              f === optVal ||
              (optLabel && f === optLabel) ||
              f === `${prop.code}:${optVal}` ||
              f === `${propKey}:${optVal}` ||
              (optLabel && f === `${prop.code}:${optLabel}`)
          );
        };

        const handleOptionToggle = (optVal: string, optLabel?: string) => {
          const currentlyOn = isSelected(optVal, optLabel);
          const featKey = `${prop.code || propKey}:${optVal}`;

          let nextBreeds = value.breeds ?? [];
          let nextColors = value.colors ?? [];
          let nextAges = value.ages ?? [];
          let nextGenders = value.genders ?? [];
          let nextFeatures = value.features ?? [];

          if (isBreed) {
            nextBreeds = currentlyOn
              ? nextBreeds.filter((b) => b !== optVal && (!optLabel || b !== optLabel))
              : [...nextBreeds, optVal];
          } else if (isColor) {
            nextColors = currentlyOn
              ? nextColors.filter((c) => c !== optVal && (!optLabel || c !== optLabel))
              : [...nextColors, optVal];
          } else if (isAge) {
            nextAges = currentlyOn
              ? nextAges.filter((a) => a !== optVal && (!optLabel || a !== optLabel))
              : [...nextAges, optVal];
          } else if (isGender) {
            nextGenders = currentlyOn
              ? nextGenders.filter((g) => g !== optVal && (!optLabel || g !== optLabel))
              : [...nextGenders, optVal];
          } else {
            if (currentlyOn) {
              nextFeatures = nextFeatures.filter(
                (f) =>
                  f !== featKey &&
                  f !== optVal &&
                  (!optLabel || f !== optLabel) &&
                  f !== `${propKey}:${optVal}` &&
                  f !== `${prop.code}:${optVal}` &&
                  (!optLabel || f !== `${prop.code}:${optLabel}`)
              );
            } else {
              nextFeatures = [...nextFeatures, featKey];
            }
          }

          onChange({
            ...value,
            breeds: nextBreeds,
            colors: nextColors,
            ages: nextAges,
            genders: nextGenders,
            features: nextFeatures,
          });
        };

        const selectedCount = (prop.options || []).filter((o) =>
          isSelected(o.value, o.label)
        ).length;
        const selectHint = selectedCount > 0 ? `${selectedCount} seçili` : null;

        return (
          <Accordion
            key={propKey}
            title={prop.title}
            open={openGroups[propKey] ?? true}
            onToggle={() => toggleGroup(propKey)}
            hint={selectHint}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {(prop.options || []).map((opt) => {
              const optVal = opt.value || opt.label;
              const optLabel = opt.label || opt.value;
              const active = isSelected(optVal, optLabel);

              return (
                <FilterRow
                  key={optVal}
                  label={optLabel}
                  multi
                  selected={active}
                  onSelect={() => handleOptionToggle(optVal, optLabel)}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>
        );
      })}

      {/* Metin ve Sayısal Filtrelenebilir Alanlar */}
      {otherProps.map((prop) => {
        const propKey = prop.code || prop.title;
        const currentVal =
          value.features
            ?.find((f) => f.startsWith(`${prop.code}:`) || f.startsWith(`${propKey}:`))
            ?.split(':')[1] ?? '';

        return (
          <Accordion
            key={propKey}
            title={prop.title}
            open={openGroups[propKey] ?? true}
            onToggle={() => toggleGroup(propKey)}
            hint={currentVal || null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            <View style={{ paddingVertical: 6, paddingHorizontal: 2 }}>
              <TextInput
                value={currentVal}
                onChangeText={(t) => {
                  const others = (value.features ?? []).filter(
                    (f) => !f.startsWith(`${prop.code}:`) && !f.startsWith(`${propKey}:`)
                  );
                  const next = t.trim() ? [...others, `${prop.code || propKey}:${t}`] : others;
                  onChange({ ...value, features: next });
                }}
                placeholder={`${prop.title} ile filtrele...`}
                placeholderTextColor={textMuted}
                style={{
                  color: text,
                  borderColor: border,
                  backgroundColor: surface,
                  paddingHorizontal: 12,
                  height: 38,
                  borderRadius: 8,
                  borderWidth: 1,
                  fontSize: 13,
                }}
              />
            </View>
          </Accordion>
        );
      })}



      {/* 7. İlan Tarihi (Periyot - Her Zaman Görünür) */}
      <Accordion
        title="İlan Tarihi"
        open={!!openGroups.period}
        onToggle={() => toggleGroup('period')}
        hint={periodLabel(value.period)}
        text={text}
        textMuted={textMuted}
        border={border}
      >
        <FilterRow
          label="Tümü"
          selected={value.period == null}
          onSelect={() => onChange({ ...value, period: null })}
          {...rowTheme}
        />
        {PERIOD_OPTIONS.map((opt) => (
          <FilterRow
            key={opt.id}
            label={opt.label}
            selected={value.period === opt.id}
            onSelect={() =>
              onChange({
                ...value,
                period: value.period === opt.id ? null : opt.id,
              })
            }
            {...rowTheme}
          />
        ))}
      </Accordion>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 2,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    paddingRight: 2,
  },
  headMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.45,
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
  },
  clear: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 12,
  },
  sectionTitle: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hint: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
  },
  sectionBody: {
    paddingBottom: 10,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 36,
    paddingVertical: 4,
  },
  rowIndent: {
    paddingLeft: 26,
  },
  radioHit: {
    paddingVertical: 4,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  check: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 13,
    letterSpacing: -0.12,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 8,
  },
  subSpaced: {
    marginTop: 16,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    minWidth: 0,
  },
  cityList: {
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { overflowY: 'auto' as 'visible' },
      default: {},
    }),
  },
  cityListContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyHint: {
    fontSize: 12,
    paddingVertical: 8,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  priceCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceSplit: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  priceAffix: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    paddingVertical: 2,
    minWidth: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingVertical: 4,
  },
  switch: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});
