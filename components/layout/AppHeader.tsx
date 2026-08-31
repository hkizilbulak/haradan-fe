import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark } from './BrandMark';
import { HomeContentContainer } from './HomeContentContainer';
import { useHeaderDrawers } from './HeaderDrawersContext';
import { Radius } from '@/constants/Radius';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useFavorites } from '@/hooks/useFavorites';
import { useLiveAdvertSearch } from '@/hooks/useLiveAdvertSearch';
import { SearchDropdown } from '@/components/search';
import { prepareListingWizardEntry } from '@/services/listing';
import {
  HEADER_FLEX_SLOT_POINTER_EVENTS,
  headerNavHref,
  headerNavKeyFromPath,
  navigateHome,
  navigateToListings,
} from '@/services/navigation';
import type { HeaderNavKey } from '@/services/navigation';
import type { CatalogProductCard, CategoryTreeNode } from '@/types';

export type { HeaderNavKey };

const NAV_ITEMS: { key: HeaderNavKey; label: string }[] = [
  { key: 'home', label: 'Anasayfa' },
  { key: 'listings', label: 'İlanlar' },
  { key: 'my-listings', label: 'İlanlarım' },
];

type AppHeaderProps = {
  brandName?: string;
  /** Login sonrası true — yalnızca profil ikonu. */
  isLoggedIn?: boolean;
  categories?: CategoryTreeNode[];
  onFavoritesPress?: () => void;
  onLoginPress?: () => void;
  onSignupPress?: () => void;
  onProfilePress?: () => void;
  onPostAdPress?: () => void;
  onNavPress?: (key: HeaderNavKey) => void;
  /** Header arama — verilmezse ilanlar sayfasına q ile gider. */
  onSearchSubmit?: (query: string) => void;
};

const ACTIVE = '#ffffff';
const INACTIVE = '#8a8a93';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const DEFAULT_CATEGORIES: CategoryTreeNode[] = [
  {
    id: 'c-satilik',
    slug: 'satilik-atlar',
    name: 'Satılık Atlar',
    allowTjk: true,
    children: [
      { id: 'c-satilik-yaris', slug: 'satilik-yaris-ati', name: 'Satılık Yarış Atı', allowTjk: true, children: [] },
      { id: 'c-satilik-kisrak', slug: 'satilik-kisrak', name: 'Satılık Kısrak', allowTjk: true, children: [] },
      { id: 'c-satilik-tay', slug: 'satilik-tay', name: 'Satılık Tay', allowTjk: true, children: [] },
      { id: 'c-satilik-aygir', slug: 'satilik-aygir', name: 'Satılık Aygır', allowTjk: true, children: [] },
    ],
  },
  {
    id: 'c-hizmet',
    slug: 'at-hizmetleri',
    name: 'At Hizmetleri',
    allowTjk: false,
    children: [
      { id: 'c-nakliye', slug: 'at-nakliyesi', name: 'At Nakliyesi', allowTjk: false, children: [] },
      { id: 'c-pansiyon', slug: 'pansiyon-haralar', name: 'Pansiyon Haralar', allowTjk: false, children: [] },
      { id: 'c-nalbant', slug: 'nalbantlar', name: 'Nalbantlar', allowTjk: false, children: [] },
    ],
  },
  {
    id: 'c-asim',
    slug: 'asim-hizmetleri',
    name: 'Aşım Hizmetleri',
    allowTjk: true,
    children: [
      { id: 'c-arap-aygir', slug: 'arap-aygir', name: 'Arap Aygır', allowTjk: true, children: [] },
      { id: 'c-ingiliz-aygir', slug: 'ingiliz-aygir', name: 'İngiliz Aygır', allowTjk: true, children: [] },
    ],
  },
];

export function AppHeader({
  brandName = 'Haradan.com',
  isLoggedIn = false,
  categories = DEFAULT_CATEGORIES,
  onFavoritesPress,
  onLoginPress,
  onSignupPress,
  onProfilePress,
  onPostAdPress,
  onNavPress,
  onSearchSubmit,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const hydrated = useIsHydrated();
  const effectiveLoggedIn = hydrated && isLoggedIn;
  const showAuthText = width >= 640 && !effectiveLoggedIn;
  const showPostAdLabel = width >= 640;
  const active = headerNavKeyFromPath(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const categoryHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const {
    query,
    setQuery,
    results,
    loading,
    isOpen,
    setIsOpen,
    clear: clearSearch,
    close: closeDropdown,
    ensureLoaded,
  } = useLiveAdvertSearch({
    limit: 6,
    debounceMs: 180,
  });

  const header = useThemeColor('header');
  const headerMuted = useThemeColor('headerMuted');
  const headerBorder = useThemeColor('headerBorder');
  const badgeSuccess = useThemeColor('badgeSuccess');
  const drawers = useHeaderDrawers();
  const { count: rawBadgeCount } = useFavorites();
  const badgeCount = hydrated ? rawBadgeCount : 0;

  const openAccount = () => {
    if (isLoggedIn) {
      if (drawers) {
        drawers.openProfile();
        return;
      }
      onProfilePress?.();
      return;
    }
    onLoginPress?.();
  };

  const openWishlist = () => {
    if (!isLoggedIn) {
      router.push('/auth/login?next=/');
      return;
    }
    if (drawers) {
      drawers.openFavorites();
      return;
    }
    onFavoritesPress?.();
  };

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      duration: 240,
      easing: EASE,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && searchOpen) {
        inputRef.current?.focus();
        if (query.trim()) setIsOpen(true);
      }
    });
  }, [searchOpen, searchAnim, query, setIsOpen]);

  const goHome = () => {
    navigateHome(router);
  };

  const handleNav = (key: HeaderNavKey) => {
    if (key === 'home') navigateHome(router);
    else if (key === 'listings') navigateToListings(router, {});
    else if (key === 'my-listings') {
      router.push(
        headerNavHref('my-listings', isLoggedIn) as
        | '/my-listings'
        | '/auth/login?next=/my-listings'
      );
    }
    onNavPress?.(key);
  };

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    clearSearch();
  }, [clearSearch]);

  const submitSearch = useCallback(
    (overrideQuery?: string) => {
      const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
      if (!q) return;
      onSearchSubmit?.(q);
      navigateToListings(router, { q });
      handleCloseSearch();
    },
    [query, onSearchSubmit, router, handleCloseSearch]
  );

  const handleSelectAdvert = useCallback(
    (advert: CatalogProductCard) => {
      handleCloseSearch();
      router.push(`/advert/${advert.id}`);
    },
    [router, handleCloseSearch]
  );

  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isWide ? 260 : Math.min(200, width * 0.46)],
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, 10),
          backgroundColor: header,
          borderBottomColor: headerBorder,
        },
      ]}
      accessibilityRole="header"
    >
      <HomeContentContainer>
        <View style={styles.bar}>
          <View
            style={[styles.slot, styles.slotLeft]}
            pointerEvents={HEADER_FLEX_SLOT_POINTER_EVENTS}
          >
            <Pressable
              onPress={goHome}
              accessibilityRole="link"
              accessibilityLabel={`${brandName} ana sayfa`}
              hitSlop={6}
              style={({ pressed }) => [
                styles.brandRow,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <BrandMark variant="light" height={32} />
              {!searchOpen || isWide ? (
                <Text style={styles.brand}>{brandName}</Text>
              ) : null}
            </Pressable>
          </View>

          {isWide && !searchOpen ? (
            <View style={styles.navOverlay} pointerEvents="box-none">
              <View style={styles.navCenter} accessibilityRole="menubar">
                <NavLink
                  label="Anasayfa"
                  active={active === 'home'}
                  onPress={() => handleNav('home')}
                />

                {categories.slice(0, 5).map((cat) => {
                  const isOpen = openCategoryId === cat.id;
                  const hasChildren = cat.children && cat.children.length > 0;
                  return (
                    <View
                      key={cat.id}
                      style={styles.categoryNavWrapper}
                      {...(Platform.OS === 'web'
                        ? {
                          onMouseEnter: () => {
                            if (categoryHoverTimer.current) clearTimeout(categoryHoverTimer.current);
                            setOpenCategoryId(cat.id);
                          },
                          onMouseLeave: () => {
                            categoryHoverTimer.current = setTimeout(() => {
                              setOpenCategoryId(null);
                            }, 200);
                          },
                        }
                        : {})}
                    >
                      <Pressable
                        onPress={() => {
                          setOpenCategoryId(null);
                          navigateToListings(router, { category: cat.slug });
                        }}
                        style={({ pressed }) => [
                          styles.navItem,
                          styles.categoryHoverNav,
                          { opacity: pressed ? 0.75 : 1 },
                        ]}
                      >
                        <Text style={[styles.navLabel, { color: isOpen ? ACTIVE : INACTIVE }]}>
                          {cat.name}
                        </Text>
                        {hasChildren ? (
                          <Ionicons
                            name="chevron-down"
                            size={12}
                            color={isOpen ? ACTIVE : INACTIVE}
                            style={{ marginLeft: 4 }}
                          />
                        ) : null}
                      </Pressable>

                      {isOpen && hasChildren ? (
                        <View style={styles.categoryDropdownMenu}>
                          <View style={styles.categorySubList}>
                            {cat.children.map((sub) => (
                              <Pressable
                                key={sub.id}
                                onPress={() => {
                                  setOpenCategoryId(null);
                                  navigateToListings(router, { category: sub.slug });
                                }}
                                style={({ pressed }) => [
                                  styles.categorySubItem,
                                  pressed && { opacity: 0.7 },
                                ]}
                              >
                                <Ionicons name="chevron-forward-outline" size={12} color="#94a3b8" />
                                <Text style={styles.categorySubText}>{sub.name}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View
            style={[styles.slot, styles.slotRight]}
            pointerEvents={HEADER_FLEX_SLOT_POINTER_EVENTS}
          >
            <AuthLinks
              showText={showAuthText && !searchOpen}
              isLoggedIn={effectiveLoggedIn}
              headerMuted={headerMuted}
              onLoginPress={onLoginPress}
              onSignupPress={onSignupPress}
              onProfilePress={openAccount}
            />
            <View>
              <HeaderIcon
                name="heart-outline"
                label="Favoriler"
                color={headerMuted}
                onPress={openWishlist}
              />
              {badgeCount > 0 ? (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: badgeSuccess, borderColor: header },
                  ]}
                >
                  <Text style={styles.countText}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <PostAdButton
              onPress={() => {
                prepareListingWizardEntry();
                if (onPostAdPress) {
                  onPostAdPress();
                  return;
                }
                router.push('/post');
              }}
              compact={!showPostAdLabel}
            />
          </View>
        </View>

        {!isWide ? (
          <View style={styles.navMobile} accessibilityRole="menubar">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                label={item.label}
                active={active === item.key}
                onPress={() => handleNav(item.key)}
                compact
              />
            ))}
          </View>
        ) : null}
      </HomeContentContainer>
    </View>
  );
}

function AuthLinks({
  showText,
  isLoggedIn,
  headerMuted,
  onLoginPress,
  onSignupPress,
  onProfilePress,
}: {
  showText: boolean;
  isLoggedIn: boolean;
  headerMuted: string;
  onLoginPress?: () => void;
  onSignupPress?: () => void;
  onProfilePress?: () => void;
}) {
  if (isLoggedIn) {
    return (
      <Pressable
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Profil"
        hitSlop={6}
        style={({ pressed }) => [
          styles.authIconHit,
          { opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Ionicons name="person" size={18} color={headerMuted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.authRow}>
      <Pressable
        onPress={onLoginPress}
        accessibilityRole="button"
        accessibilityLabel="Giriş yap"
        hitSlop={6}
        style={({ pressed }) => [
          styles.authIconHit,
          { opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Ionicons name="person-outline" size={18} color={headerMuted} />
      </Pressable>
      {showText ? (
        <View style={styles.authTextRow}>
          <Pressable onPress={onLoginPress} hitSlop={4}>
            <Text style={[styles.authText, { color: headerMuted }]}>
              Giriş yap
            </Text>
          </Pressable>
          <Text style={[styles.authSep, { color: headerMuted }]}>/</Text>
          <Pressable onPress={onSignupPress} hitSlop={4}>
            <Text style={[styles.authText, { color: headerMuted }]}>
              Kayıt ol
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function PostAdButton({
  onPress,
  compact,
}: {
  onPress?: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="İlan ver"
      style={({ pressed }) => [
        styles.postAdBtn,
        compact && styles.postAdBtnCompact,
        {
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...Platform.select({
            web: {
              boxShadow: pressed
                ? '0 4px 12px rgba(0,0,0,0.12)'
                : '0 6px 18px rgba(0,0,0,0.14)',
              cursor: 'pointer' as const,
            },
            default: {},
          }),
        },
      ]}
    >
      <Ionicons name="add-circle" size={compact ? 17 : 18} color="#ffffff" />
      {!compact ? <Text style={styles.postAdLabel}>İlan Ver</Text> : null}
    </Pressable>
  );
}

function NavLink({
  label,
  active,
  onPress,
  compact = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: 260,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  const color = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [INACTIVE, ACTIVE],
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
      hitSlop={6}
      style={({ pressed }) => [
        compact ? styles.navMobileItem : styles.navItem,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Animated.Text
        style={[
          compact ? styles.navMobileLabel : styles.navLabel,
          { color },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function HeaderIcon({
  name,
  label,
  color,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconHit, { opacity: pressed ? 0.55 : 1 }]}
    >
      <Ionicons name={name} size={18} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    position: 'relative',
  },
  bar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  slot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  slotLeft: {
    justifyContent: 'flex-start',
  },
  slotRight: {
    justifyContent: 'flex-end',
    gap: 6,
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  categoryNavWrapper: {
    position: 'relative',
    zIndex: 999,
  },
  categoryHoverNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    minWidth: 190,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      },
      default: {},
    }),
  },
  categorySubList: {
    gap: 6,
  },
  categorySubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  categorySubText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '400',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  navMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 4,
    paddingBottom: 2,
  },
  navMobileItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  navMobileLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 2,
  },
  searchCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    position: 'relative',
    zIndex: 100,
  },
  searchFieldWrap: {
    overflow: 'hidden',
    height: 36,
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '400',
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
  },
  headerDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    zIndex: 1000,
  },
  authIconHit: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authText: {
    ...Typography.small,
    fontWeight: '500',
  },
  authSep: {
    ...Typography.small,
    opacity: 0.6,
  },
  postAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ff6000',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 38,
    marginLeft: 4,
  },
  postAdBtnCompact: {
    paddingHorizontal: 10,
    minWidth: 38,
  },
  postAdLabel: {
    ...Typography.small,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  iconHit: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.avatar,
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  countText: {
    color: '#0c0c0e',
    fontSize: 8,
    fontWeight: '700',
  },
});
