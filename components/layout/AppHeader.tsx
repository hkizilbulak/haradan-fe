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
import type { CatalogProductCard } from '@/types';

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

export function AppHeader({
  brandName = 'Haradan.com',
  isLoggedIn = false,
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
  const showAuthText = width >= 640 && !isLoggedIn;
  const showPostAdLabel = width >= 640;
  const active = headerNavKeyFromPath(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
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
  } = useLiveAdvertSearch({
    limit: 6,
    debounceMs: 180,
  });

  const header = useThemeColor('header');
  const headerMuted = useThemeColor('headerMuted');
  const headerBorder = useThemeColor('headerBorder');
  const badgeSuccess = useThemeColor('badgeSuccess');
  const drawers = useHeaderDrawers();
  const { count: badgeCount } = useFavorites();

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
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.key}
                    label={item.label}
                    active={active === item.key}
                    onPress={() => handleNav(item.key)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View
            style={[styles.slot, styles.slotRight]}
            pointerEvents={HEADER_FLEX_SLOT_POINTER_EVENTS}
          >
            <View style={styles.searchCluster} pointerEvents="auto">
              <Animated.View
                style={[
                  styles.searchFieldWrap,
                  { width: searchWidth, opacity: searchOpacity },
                ]}
                pointerEvents={searchOpen ? 'auto' : 'none'}
              >
                <View style={styles.searchField}>
                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={(txt) => {
                      setQuery(txt);
                      if (txt.trim().length > 0) setIsOpen(true);
                    }}
                    onFocus={() => {
                      if (query.trim().length > 0) setIsOpen(true);
                    }}
                    placeholder="At, kısrak, ilan ara…"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={[
                      styles.searchInput,
                      Platform.OS === 'web'
                        ? ({ outlineStyle: 'none' } as object)
                        : null,
                    ]}
                    returnKeyType="search"
                    onSubmitEditing={() => submitSearch()}
                    accessibilityLabel="Ara"
                  />
                  {query.length > 0 ? (
                    <Pressable
                      onPress={clearSearch}
                      hitSlop={6}
                      accessibilityLabel="Temizle"
                    >
                      <Ionicons
                        name="close-circle"
                        size={14}
                        color={headerMuted}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </Animated.View>

              <HeaderIcon
                name={searchOpen ? 'close-outline' : 'search-outline'}
                label={searchOpen ? 'Aramayı kapat' : 'Ara'}
                color={headerMuted}
                onPress={() => {
                  if (searchOpen) {
                    handleCloseSearch();
                  } else {
                    setSearchOpen(true);
                  }
                }}
              />

              {/* Header Canlı Arama Açılır Menüsü */}
              {searchOpen && isOpen && query.trim().length > 0 ? (
                <SearchDropdown
                  results={results}
                  loading={loading}
                  query={query}
                  isOpen={true}
                  onSelectAdvert={handleSelectAdvert}
                  onViewAll={submitSearch}
                  onClose={closeDropdown}
                  variant="header"
                  maxHeight={360}
                  style={[
                    styles.headerDropdown,
                    {
                      width: isWide ? 380 : Math.min(360, width - 24),
                    },
                  ]}
                />
              ) : null}
            </View>

            <AuthLinks
              showText={showAuthText && !searchOpen}
              isLoggedIn={isLoggedIn}
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
      <Ionicons name="add" size={compact ? 16 : 17} color="#0c0c0e" />
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
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
    color: '#0c0c0e',
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
