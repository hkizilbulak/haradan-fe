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
  isHorseCategory,
  isPansiyonCategory,
  isTransportCategory,
  isFarrierCategory,
  isStudCategory,
  PANSIYON_FACILITY_OPTIONS,
  STUD_BREED_OPTIONS,
  STUD_AGE_OPTIONS,
  COAT_COLOR_OPTIONS,
  HORSE_BREED_OPTIONS,
  HORSE_AGE_OPTIONS,
  HORSE_GENDER_OPTIONS,
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

export const FACILITY_OPTIONS = PANSIYON_FACILITY_OPTIONS;

export {
  HORSE_BREED_OPTIONS,
  HORSE_AGE_OPTIONS,
  HORSE_GENDER_OPTIONS,
  STUD_BREED_OPTIONS,
  STUD_AGE_OPTIONS,
  COAT_COLOR_OPTIONS,
};

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

  const isHorseActive = isHorseCategory(value.categorySlug);
  const isPansiyonActive = isPansiyonCategory(value.categorySlug);
  const isTransportActive = isTransportCategory(value.categorySlug);
  const isFarrierActive = isFarrierCategory(value.categorySlug);
  const isStudActive = isStudCategory(value.categorySlug);

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

    catalogRepository
      .getCategoryFormDefinition(categoryId || value.categorySlug)
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

      {/* 3. SATILIK ATLAR: Irk, Don, Yaş, Cinsiyet (YALNIZCA Satılık Atlar Seçiliyken) */}
      {isHorseActive ? (
        <>
          <Accordion
            title="At Irkı"
            open={!!openGroups['horse-breeds']}
            onToggle={() => toggleGroup('horse-breeds')}
            hint={value.breeds?.length ? value.breeds.join(', ') : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {HORSE_BREED_OPTIONS.map((breed) => {
              const selected = (value.breeds ?? []).includes(breed);
              return (
                <FilterRow
                  key={breed}
                  label={breed}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.breeds ?? [];
                    const next = selected
                      ? curr.filter((b) => b !== breed)
                      : [...curr, breed];
                    onChange({ ...value, breeds: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>

          <Accordion
            title="Donu (Renk)"
            open={!!openGroups['horse-colors']}
            onToggle={() => toggleGroup('horse-colors')}
            hint={value.colors?.length ? value.colors.join(', ') : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {COAT_COLOR_OPTIONS.map((color) => {
              const selected = (value.colors ?? []).includes(color);
              return (
                <FilterRow
                  key={color}
                  label={color}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.colors ?? [];
                    const next = selected
                      ? curr.filter((c) => c !== color)
                      : [...curr, color];
                    onChange({ ...value, colors: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>

          <Accordion
            title="Yaş"
            open={!!openGroups['horse-ages']}
            onToggle={() => toggleGroup('horse-ages')}
            hint={value.ages?.length ? `${value.ages.length} seçili` : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {HORSE_AGE_OPTIONS.map((age) => {
              const selected = (value.ages ?? []).includes(age);
              return (
                <FilterRow
                  key={age}
                  label={age}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.ages ?? [];
                    const next = selected
                      ? curr.filter((a) => a !== age)
                      : [...curr, age];
                    onChange({ ...value, ages: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>

          <Accordion
            title="Cinsiyet"
            open={!!openGroups['horse-genders']}
            onToggle={() => toggleGroup('horse-genders')}
            hint={value.genders?.length ? value.genders.join(', ') : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {HORSE_GENDER_OPTIONS.map((gender) => {
              const selected = (value.genders ?? []).includes(gender);
              return (
                <FilterRow
                  key={gender}
                  label={gender}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.genders ?? [];
                    const next = selected
                      ? curr.filter((g) => g !== gender)
                      : [...curr, gender];
                    onChange({ ...value, genders: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>
        </>
      ) : null}

      {/* 4. PANSİYON HARALAR: Tesis & Hizmet Özellikleri (YALNIZCA Pansiyon Seçiliyken) */}
      {isPansiyonActive ? (
        <Accordion
          title="Tesis / Hizmet Özellikleri"
          open={!!openGroups.facilities}
          onToggle={() => toggleGroup('facilities')}
          hint={facilityHint}
          text={text}
          textMuted={textMuted}
          border={border}
        >
          {FACILITY_OPTIONS.map((fac) => {
            const on = Boolean(value.facilities?.[fac.key]);
            return (
              <Pressable
                key={fac.key}
                onPress={() =>
                  onChange({
                    ...value,
                    facilities: {
                      ...value.facilities,
                      [fac.key]: !on,
                    },
                  })
                }
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
                  {fac.label}
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

      {/* 5. AŞIM HİZMETLERİ: At Irkı, Yaş, Don (Renk) (YALNIZCA Aşım Seçiliyken) */}
      {isStudActive ? (
        <>
          <Accordion
            title="At Irkı"
            open={!!openGroups['stud-breeds']}
            onToggle={() => toggleGroup('stud-breeds')}
            hint={value.breeds?.length ? value.breeds.join(', ') : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {STUD_BREED_OPTIONS.map((breed) => {
              const selected = (value.breeds ?? []).includes(breed);
              return (
                <FilterRow
                  key={breed}
                  label={breed}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.breeds ?? [];
                    const next = selected
                      ? curr.filter((b) => b !== breed)
                      : [...curr, breed];
                    onChange({ ...value, breeds: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>

          <Accordion
            title="Yaş"
            open={!!openGroups['stud-ages']}
            onToggle={() => toggleGroup('stud-ages')}
            hint={value.ages?.length ? `${value.ages.length} seçili` : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {STUD_AGE_OPTIONS.map((age) => {
              const selected = (value.ages ?? []).includes(age);
              return (
                <FilterRow
                  key={age}
                  label={age}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.ages ?? [];
                    const next = selected
                      ? curr.filter((a) => a !== age)
                      : [...curr, age];
                    onChange({ ...value, ages: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>

          <Accordion
            title="Donu (Renk)"
            open={!!openGroups['stud-colors']}
            onToggle={() => toggleGroup('stud-colors')}
            hint={value.colors?.length ? value.colors.join(', ') : null}
            text={text}
            textMuted={textMuted}
            border={border}
          >
            {COAT_COLOR_OPTIONS.map((color) => {
              const selected = (value.colors ?? []).includes(color);
              return (
                <FilterRow
                  key={color}
                  label={color}
                  multi
                  selected={selected}
                  onSelect={() => {
                    const curr = value.colors ?? [];
                    const next = selected
                      ? curr.filter((c) => c !== color)
                      : [...curr, color];
                    onChange({ ...value, colors: next });
                  }}
                  {...rowTheme}
                />
              );
            })}
          </Accordion>
        </>
      ) : null}

      {/* 6. BO'DAN GELEN DİNAMİK / ÖZEL KATEGORİ ÖZELLİKLERİ */}
      {value.categorySlug && categoryProperties.length > 0 ? (
        <>
          {categoryProperties
            .filter((prop) => {
              const codeUpper = (prop.code || '').toUpperCase();
              if (isHorseActive || isStudActive) {
                if (
                  codeUpper === 'HORSE_BREED' ||
                  codeUpper === 'STALLION_BREED' ||
                  codeUpper === 'COAT_COLOR' ||
                  codeUpper === 'HORSE_AGE' ||
                  codeUpper === 'STALLION_AGE' ||
                  codeUpper === 'HORSE_GENDER'
                ) {
                  return false;
                }
              }
              if (isPansiyonActive) {
                if (
                  codeUpper === 'GRASSPADDOCK' ||
                  codeUpper === 'GRASS_PADDOCK' ||
                  codeUpper === 'SANDPADDOCK' ||
                  codeUpper === 'SAND_PADDOCK' ||
                  codeUpper === 'STALLIONPADDOCK' ||
                  codeUpper === 'STALLION_PADDOCK' ||
                  codeUpper === 'VET' ||
                  codeUpper === 'VET_SERVICE' ||
                  codeUpper === 'FARRIER' ||
                  codeUpper === 'FARRIER_SERVICE' ||
                  codeUpper === 'FOALINGBARN' ||
                  codeUpper === 'FOALING_BARN'
                ) {
                  return false;
                }
              }
              return true;
            })
            .map((prop) => {
              const propKey = prop.code || prop.title;
              if (prop.dataType === 'BOOLEAN') {
                const on = Boolean(value.facilities?.[prop.code as PansiyonFacilityKey] ?? value.features?.includes(propKey));
                return (
                  <Pressable
                    key={propKey}
                    onPress={() => {
                      if (prop.code in (value.facilities || {})) {
                        onChange({
                          ...value,
                          facilities: {
                            ...value.facilities,
                            [prop.code as PansiyonFacilityKey]: !on,
                          },
                        });
                      } else {
                        const curr = value.features ?? [];
                        const next = on
                          ? curr.filter((f) => f !== propKey)
                          : [...curr, propKey];
                        onChange({ ...value, features: next });
                      }
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
                      {prop.title}
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
              }

              if (prop.options && prop.options.length > 0) {
                return (
                  <Accordion
                    key={propKey}
                    title={prop.title}
                    open={openGroups[propKey] ?? true}
                    onToggle={() => toggleGroup(propKey)}
                    hint={
                      value.features
                        ?.filter((f) => prop.options.some((o) => o.value === f || o.label === f))
                        .join(', ') || null
                    }
                    text={text}
                    textMuted={textMuted}
                    border={border}
                  >
                    {prop.options.map((opt) => {
                      const optVal = opt.value || opt.label;
                      const selected = (value.features ?? []).includes(optVal);
                      return (
                        <FilterRow
                          key={optVal}
                          label={opt.label || opt.value}
                          multi
                          selected={selected}
                          onSelect={() => {
                            const curr = value.features ?? [];
                            const next = selected
                              ? curr.filter((f) => f !== optVal)
                              : [...curr, optVal];
                            onChange({ ...value, features: next });
                          }}
                          {...rowTheme}
                        />
                      );
                    })}
                  </Accordion>
                );
              }

              // Text / String / Number dynamic properties
              const textVal =
                value.features
                  ?.find((f) => f.startsWith(`${propKey}:`))
                  ?.replace(`${propKey}:`, '') ?? '';

              return (
                <Accordion
                  key={propKey}
                  title={prop.title}
                  open={openGroups[propKey] ?? true}
                  onToggle={() => toggleGroup(propKey)}
                  hint={textVal || null}
                  text={text}
                  textMuted={textMuted}
                  border={border}
                >
                  <View style={{ paddingVertical: 6, paddingHorizontal: 2 }}>
                    <TextInput
                      value={textVal}
                      onChangeText={(t) => {
                        const others = (value.features ?? []).filter(
                          (f) => !f.startsWith(`${propKey}:`)
                        );
                        const next = t.trim() ? [...others, `${propKey}:${t}`] : others;
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
        </>
      ) : null}



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
