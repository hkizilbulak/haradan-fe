import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLiveAdvertSearch } from '@/hooks/useLiveAdvertSearch';
import { SearchDropdown } from '@/components/search';
import { navigateToListings } from '@/services/navigation';
import type { CatalogProductCard } from '@/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type QuickSearchLink = {
  id: string;
  label: string;
  query?: string;
  params?: Record<string, string>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
};

export const DEFAULT_QUICK_LINKS: QuickSearchLink[] = [
  { id: 'ingiliz', label: 'İngiliz Atı', query: 'İngiliz Atı' },
  { id: 'arap', label: 'Arap Atı', query: 'Arap Atı' },
  { id: 'tay', label: 'Tay', query: 'Tay' },
  { id: 'gebe', label: 'Gebe Kısrak', query: 'Gebe Kısrak' },
  { id: 'aygir', label: 'Aygır', query: 'Aygır' },
  { id: 'acil', label: 'Acil İlanlar', params: { urgent: '1' } },
];

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
  /** Liquid glass — hero üzerinde yüzen arama */
  variant?: 'default' | 'glass';
  /** Hızlı arama linklerini göster/gizle (varsayılan: !live) */
  showQuickLinks?: boolean;
  /** Özel hızlı arama linkleri */
  quickLinks?: QuickSearchLink[];
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);


/**
 * Banner altı arama — büyük alan; sağda tür seçimi ve otomatik canlı arama sonuçları.
 */
export const HomeSearchBar = memo(function HomeSearchBar({
  placeholder = 'İsim, cins veya ilan ara…',
  initialQuery = '',
  onQueryChange,
  live = false,
  fullWidth = false,
  compact = false,
  variant = 'default',
  showQuickLinks = !live,
  quickLinks = DEFAULT_QUICK_LINKS,
}: HomeSearchBarProps) {
  const router = useRouter();
  const width = useLayoutWidth();
  const isWide = width >= 900;
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const {
    query,
    setQuery,
    results,
    loading,
    isOpen,
    setIsOpen,
    clear,
    close: closeDropdown,
    ensureLoaded,
  } = useLiveAdvertSearch({
    initialQuery,
    limit: 6,
    debounceMs: 180,
    enabled: !live,
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  const updateQuery = (next: string) => {
    setQuery(next);
    onQueryChange?.(next);
    if (next.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const background = useThemeColor('background');

  // Dropdown yalnızca anasayfada (!live) gösterilir; /listings sayfasında (live=true) sayfa kendisi anlık filtrelenir.
  const isDropdownActive = !live && isOpen && query.trim().length > 0;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused || isDropdownActive ? 1 : 0,
      duration: 260,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [focused, isDropdownActive, focusAnim]);


  const isGlass = variant === 'glass';

  const focusedSurface = isGlass
    ? 'rgba(255,255,255,0.88)'
    : isDark
      ? '#232833'
      : '#ffffff';
  const focusedBorder = isGlass
    ? 'rgba(255,255,255,0.65)'
    : isDark
      ? 'rgba(255,255,255,0.22)'
      : 'rgba(12,12,14,0.18)';

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isGlass ? 'rgba(255,255,255,0.45)' : border,
      focusedBorder,
    ],
  });

  const bg = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isGlass ? 'rgba(255,255,255,0.72)' : surface,
      focusedSurface,
    ],
  });

  const goListings = useCallback(
    (params: Record<string, string>) => {
      closeDropdown();
      navigateToListings(router, params);
    },
    [router, closeDropdown]
  );

  const submit = useCallback(() => {
    const q = query.trim();
    closeDropdown();
    if (live) {
      onQueryChange?.(query);
      return;
    }
    if (q) goListings({ q });
    else goListings({});
  }, [query, live, onQueryChange, goListings, closeDropdown]);

  const handleQuickLinkPress = useCallback(
    (link: QuickSearchLink) => {
      closeDropdown();
      if (link.query) {
        setQuery(link.query);
        onQueryChange?.(link.query);
        goListings({ q: link.query, ...link.params });
      } else if (link.params) {
        goListings(link.params);
      }
    },
    [closeDropdown, setQuery, onQueryChange, goListings]
  );

  const handleSelectAdvert = useCallback(
    (advert: CatalogProductCard) => {
      closeDropdown();
      router.push(`/advert/${advert.id}`);
    },
    [router, closeDropdown]
  );

  const handleViewAll = useCallback(
    (searchQuery: string) => {
      closeDropdown();
      const q = searchQuery.trim();
      if (q) goListings({ q });
      else goListings({});
    },
    [goListings, closeDropdown]
  );

  const handleClear = () => {
    clear();
    onQueryChange?.('');
  };

  return (
    <View
      nativeID="haradan-search-bar"
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        isWide && !fullWidth && styles.wrapWide,
        fullWidth && styles.wrapFull,
        isDropdownActive && styles.wrapActive,
      ]}
      accessibilityRole="search"
      {...(Platform.OS === 'web'
        ? ({ dataSet: { keepSearch: 'true' } } as object)
        : null)}
    >
      <Animated.View
        style={[
          styles.field,
          isGlass && styles.fieldGlass,
          {
            backgroundColor: bg,
            borderColor,
            ...Platform.select({
              web: {
                backdropFilter: isGlass
                  ? 'blur(20px) saturate(160%)'
                  : undefined,
                WebkitBackdropFilter: isGlass
                  ? 'blur(20px) saturate(160%)'
                  : undefined,
                boxShadow:
                  focused || isDropdownActive
                    ? isDark
                      ? '0 12px 36px rgba(0, 0, 0, 0.45)'
                      : isGlass
                        ? '0 16px 40px rgba(12,12,14,0.12)'
                        : '0 12px 36px rgba(15, 23, 42, 0.07)'
                    : isGlass
                      ? '0 8px 28px rgba(12,12,14,0.08)'
                      : isDark
                        ? '0 2px 12px rgba(0, 0, 0, 0.25)'
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
          onFocus={() => {
            setFocused(true);
            void ensureLoaded();
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          onSubmitEditing={submit}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={isDark ? 'rgba(243,245,249,0.3)' : 'rgba(12,12,14,0.22)'}
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
            onPress={handleClear}
            hitSlop={8}
            accessibilityLabel="Temizle"
            style={styles.iconBtn}
          >
            <Ionicons name="close-circle" size={18} color={textMuted} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel="Ara"
          style={({ pressed }) => [
            styles.menuBtn,
            {
              backgroundColor: header,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#fff"
          />
        </Pressable>
      </Animated.View>

      {/* Hızlı Arama Linkleri (Minimalist) */}
      {showQuickLinks && quickLinks.length > 0 ? (
        <View style={styles.quickLinksWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickLinksScroll}
          >
            {quickLinks.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => handleQuickLinkPress(link)}
                accessibilityRole="button"
                accessibilityLabel={link.label}
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    backgroundColor: isGlass
                      ? pressed
                        ? 'rgba(255, 255, 255, 0.32)'
                        : 'rgba(255, 255, 255, 0.18)'
                      : pressed
                        ? isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : 'rgba(0, 0, 0, 0.06)'
                        : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isGlass
                      ? pressed
                        ? 'rgba(255, 255, 255, 0.55)'
                        : 'rgba(255, 255, 255, 0.32)'
                      : border,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    ...(Platform.OS === 'web'
                      ? ({
                          backdropFilter: isGlass
                            ? 'blur(12px) saturate(140%)'
                            : undefined,
                          WebkitBackdropFilter: isGlass
                            ? 'blur(12px) saturate(140%)'
                            : undefined,
                          cursor: 'pointer',
                          transition:
                            'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
                        } as object)
                      : null),
                  },
                ]}
              >
                {link.icon ? (
                  <Ionicons
                    name={link.icon}
                    size={12}
                    color={
                      isGlass
                        ? 'rgba(255, 255, 255, 0.9)'
                        : textSecondary
                    }
                  />
                ) : null}
                <Text
                  style={[
                    styles.quickChipText,
                    {
                      color: isGlass
                        ? '#ffffff'
                        : text,
                    },
                  ]}
                >
                  {link.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Canlı Filtreleme Açılır Menüsü */}
      <SearchDropdown
        results={results}
        loading={loading}
        query={query}
        isOpen={isDropdownActive}
        onSelectAdvert={handleSelectAdvert}
        onViewAll={handleViewAll}
        onClose={closeDropdown}
        variant="home"
        maxHeight={400}
      />
    </View>
  );
});


const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    zIndex: 4,
  },
  wrapActive: {
    zIndex: 1000,
    position: 'relative',
    ...Platform.select({
      android: { elevation: 20 },
      default: {},
    }),
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
  fieldGlass: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingLeft: 16,
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
  quickLinksWrap: {
    marginTop: 10,
  },
  quickLinksScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 32,
  },
  quickChipText: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});
