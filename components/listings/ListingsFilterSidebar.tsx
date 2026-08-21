import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
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
} from '@/components/listings/filterConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { locationLookup } from '@/services/location';
import { useProvinces } from '@/hooks/useLocation';
import type { CatalogFacetGroup, CatalogFacetOption, CatalogFacets } from '@/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ListingsFiltersState = {
  categorySlug: string | null;
  breed: string | null;
  urgentOnly: boolean;
  provinceIds: string[];
  priceMinTl: number | null;
  priceMaxTl: number | null;
};

type ListingsFilterSidebarProps = {
  facets: CatalogFacets | null;
  value: ListingsFiltersState;
  onChange: (next: ListingsFiltersState) => void;
  resultCount: number;
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
  multi,
  text,
  textMuted,
  textSecondary,
  header,
  border,
}: RowProps) {
  return (
    <View style={[styles.row, indent && styles.rowIndent]}>
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

const EMPTY: ListingsFiltersState = {
  categorySlug: null,
  breed: null,
  urgentOnly: false,
  provinceIds: [],
  priceMinTl: null,
  priceMaxTl: null,
};

/** Sol filtre — kapalı akordeon; detay basınca açılır. */
export const ListingsFilterSidebar = memo(function ListingsFilterSidebar({
  facets,
  value,
  onChange,
  resultCount,
}: ListingsFilterSidebarProps) {
  const groups = facets?.groups ?? [];
  const { items: provinces } = useProvinces();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'listing-type': true,
    'horse-breed': true,
    advanced: false,
  });
  const [openOptions, setOpenOptions] = useState<Record<string, boolean>>({});
  const [cityQuery, setCityQuery] = useState('');
  const [minText, setMinText] = useState(formatTlInput(value.priceMinTl));
  const [maxText, setMaxText] = useState(formatTlInput(value.priceMaxTl));
  const seeded = useRef(false);

  useEffect(() => {
    setMinText(formatTlInput(value.priceMinTl));
    setMaxText(formatTlInput(value.priceMaxTl));
  }, [value.priceMinTl, value.priceMaxTl]);

  useEffect(() => {
    if (groups.length === 0) return;
    const hasAdvanced =
      value.provinceIds.length > 0 ||
      value.priceMinTl != null ||
      value.priceMaxTl != null ||
      value.urgentOnly;
    if (hasAdvanced) {
      setOpenGroups((p) => ({ ...p, advanced: true }));
    }
    if (!value.categorySlug) return;
    const nextOptions: Record<string, boolean> = {};
    groups.forEach((g) => {
      g.options.forEach((o) => {
        if (
          o.slug === value.categorySlug ||
          o.children.some((c) => c.slug === value.categorySlug)
        ) {
          nextOptions[o.id] = true;
        }
      });
    });
    setOpenOptions((prev) => ({ ...prev, ...nextOptions }));
  }, [groups, value.categorySlug, value.provinceIds, value.priceMinTl, value.priceMaxTl, value.urgentOnly]);

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
    value.priceMinTl != null ||
    value.priceMaxTl != null;

  const advancedHint =
    [
      value.provinceIds.length === 1
        ? locationLookup.getProvinceName(value.provinceIds[0])
        : value.provinceIds.length > 1
          ? `${locationLookup.getProvinceName(value.provinceIds[0])} +${value.provinceIds.length - 1}`
          : null,
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
  const breedGroup = groups.find((g) => g.kind === 'breed');

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
            onPress={() => onChange(EMPTY)}
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
          {categoryGroup.options.map((option) => {
            const hasKids = option.children.length > 0;
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
                    setOpenOptions((p) => ({ ...p, [option.id]: !optionOpen }));
                  }}
                  {...rowTheme}
                />
                {hasKids && optionOpen
                  ? option.children.map((child) => (
                      <FilterRow
                        key={child.id}
                        label={child.label}
                        selected={value.categorySlug === child.slug}
                        onSelect={() =>
                          onChange({
                            ...value,
                            categorySlug:
                              value.categorySlug === child.slug
                                ? option.slug
                                : child.slug,
                          })
                        }
                        indent
                        {...rowTheme}
                      />
                    ))
                  : null}
              </View>
            );
          })}
        </Accordion>
      ) : null}

      {breedGroup ? (
        <Accordion
          title={breedGroup.label}
          open={!!openGroups[breedGroup.id]}
          onToggle={() => toggleGroup(breedGroup.id)}
          hint={value.breed}
          text={text}
          textMuted={textMuted}
          border={border}
        >
          {breedGroup.options.map((option) => (
            <FilterRow
              key={option.id}
              label={option.label}
              selected={value.breed === option.slug}
              onSelect={() => applyOption(breedGroup, option)}
              {...rowTheme}
            />
          ))}
        </Accordion>
      ) : null}

      <Accordion
        title="Detaylı filtreleme"
        open={!!openGroups.advanced}
        onToggle={() => toggleGroup('advanced')}
        hint={advancedHint}
        text={text}
        textMuted={textMuted}
        border={border}
      >
        <Text style={[styles.subLabel, { color: textMuted }]}>Konum</Text>
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
    minHeight: 40,
    gap: 10,
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
