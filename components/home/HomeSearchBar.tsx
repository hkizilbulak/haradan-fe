import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HomeSearchBarProps = {
  placeholder?: string;
  /** Listings sayfası — mevcut arama metni. */
  initialQuery?: string;
  /** Yazarken anlık filtre (listings). */
  onQueryChange?: (q: string) => void;
  /** Enter / chip ile sayfa değiştirme; live iken yalnızca metin güncellenir. */
  live?: boolean;
  /** İçerik genişliğine yay. */
  fullWidth?: boolean;
  /** Dış boşlukları sıkıştır (katalog başlığı). */
  compact?: boolean;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const LISTING_TYPES = [
  { id: 'satilik-atlar', label: 'Satılık Atlar' },
  { id: 'satilik-yaris-ati', label: 'Yarış Atı' },
  { id: 'satilik-kisrak', label: 'Kısrak' },
  { id: 'satilik-aygir', label: 'Aygır' },
  { id: 'satilik-binek-ati', label: 'Binek Atı' },
  { id: 'satilik-pony', label: 'Pony' },
  { id: 'at-hizmetleri', label: 'At Hizmetleri' },
  { id: 'asim-hizmetleri', label: 'Aşım Hizmetleri' },
] as const;

const HORSE_BREEDS = [
  { id: 'Thoroughbred', label: 'Thoroughbred' },
  { id: 'Arabian', label: 'Arabian' },
  { id: 'Warmblood', label: 'Warmblood' },
  { id: 'Haflinger', label: 'Haflinger' },
  { id: 'Pony', label: 'Pony' },
  { id: 'Shetland', label: 'Shetland' },
] as const;

/**
 * Banner altı arama — büyük alan; sağda tür seçimi → /listings.
 */
export const HomeSearchBar = memo(function HomeSearchBar({
  placeholder = 'İsim, cins veya ilan ara…',
  initialQuery = '',
  onQueryChange,
  live = false,
  fullWidth = false,
  compact = false,
}: HomeSearchBarProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setQuery(initialQuery);
    if (!initialQuery) setMenuOpen(false);
  }, [initialQuery]);

  const updateQuery = (next: string) => {
    setQuery(next);
    onQueryChange?.(next);
  };

  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const background = useThemeColor('background');

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused || menuOpen ? 1 : 0,
      duration: 260,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [focused, menuOpen, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [border, 'rgba(12,12,14,0.16)'],
  });

  const bg = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [surface, '#ffffff'],
  });

  const goListings = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    setMenuOpen(false);
    router.push((qs ? `/listings?${qs}` : '/listings') as '/listings');
  };

  const submit = () => {
    const q = query.trim();
    if (live) {
      onQueryChange?.(query);
      setMenuOpen(false);
      return;
    }
    if (q) goListings({ q });
    else goListings({});
  };

  const toggleMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuOpen((v) => !v);
  };

  return (
    <View
      nativeID="haradan-search-bar"
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        isWide && !fullWidth && styles.wrapWide,
        fullWidth && styles.wrapFull,
      ]}
      accessibilityRole="search"
      {...(Platform.OS === 'web'
        ? ({ dataSet: { keepSearch: 'true' } } as object)
        : null)}
    >
      <Animated.View
        style={[
          styles.field,
          {
            backgroundColor: bg,
            borderColor,
            ...Platform.select({
              web: {
                boxShadow:
                  focused || menuOpen
                    ? '0 12px 36px rgba(15, 23, 42, 0.07)'
                    : '0 2px 12px rgba(15, 23, 42, 0.03)',
                transition: 'box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1)',
              },
              default: {},
            }),
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={22}
          color={focused ? textSecondary : textMuted}
        />
        <TextInput
          value={query}
          onChangeText={updateQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={submit}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="rgba(12,12,14,0.22)"
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            {
              color: text,
              ...(Platform.OS === 'web'
                ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
                : null),
            },
          ]}
          accessibilityLabel={placeholder}
        />

        {query.length > 0 ? (
          <Pressable
            onPress={() => updateQuery('')}
            hitSlop={8}
            accessibilityLabel="Temizle"
            style={styles.iconBtn}
          >
            <Ionicons name="close-circle" size={18} color={textMuted} />
          </Pressable>
        ) : null}

        <View style={[styles.divider, { backgroundColor: border }]} />

        <Pressable
          onPress={toggleMenu}
          accessibilityRole="button"
          accessibilityLabel="İlan ve at türleri"
          accessibilityState={{ expanded: menuOpen }}
          style={({ pressed }) => [
            styles.menuBtn,
            {
              backgroundColor: menuOpen ? header : 'transparent',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={menuOpen ? '#fff' : text}
          />
        </Pressable>
      </Animated.View>

      {menuOpen ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: surface,
              borderColor: border,
              ...Platform.select({
                web: { boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' },
                default: {
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 16,
                  elevation: 3,
                },
              }),
            },
          ]}
        >
          <Text style={[styles.groupLabel, { color: textMuted }]}>
            İlan türleri
          </Text>
          <View style={styles.chipRow}>
            {LISTING_TYPES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => goListings({ category: t.id })}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: background,
                    borderColor: border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: textSecondary }]}>
                  {t.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={textMuted}
                />
              </Pressable>
            ))}
          </View>

          <Text style={[styles.groupLabel, { color: textMuted }]}>
            At türleri
          </Text>
          <View style={styles.chipRow}>
            {HORSE_BREEDS.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => goListings({ breed: b.id })}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: background,
                    borderColor: border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: textSecondary }]}>
                  {b.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={textMuted}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={submit}
            style={({ pressed }) => [
              styles.allBtn,
              {
                backgroundColor: header,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.allBtnText}>Tüm ilanları gör</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    zIndex: 4,
  },
  wrapWide: {
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
  },
  wrapFull: {
    maxWidth: '100%',
    width: '100%',
    alignSelf: 'stretch',
  },
  wrapCompact: {
    marginTop: 0,
    marginBottom: Spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingLeft: 22,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.15,
    paddingVertical: 18,
    minWidth: 0,
  },
  iconBtn: { padding: 4 },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 14,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  allBtn: {
    marginTop: 4,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
