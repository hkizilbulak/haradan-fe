import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ListingsFilterSidebar,
  type ListingsFiltersState,
} from '@/components/listings/ListingsFilterSidebar';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { ListingsSearchBanner } from '@/components/listings/ListingsSearchBanner';
import { HomeSearchBar, SiteFooter } from '@/components/home';
import { HomeContentContainer } from '@/components/layout';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useCatalogFacets } from '@/hooks/useCatalogFacets';
import { useFavorites } from '@/hooks/useFavorites';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { usePublishedAdvertsSearch } from '@/hooks/usePublishedAdvertsSearch';
import { usePlacementBanners } from '@/hooks/usePlacementBanners';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  matchesPrice,
  parseProvinceParam,
  parseTlParam,
  serializeProvinceParam,
} from '@/components/listings/filterConfig';
import { syncListingsQuery } from '@/components/listings/syncListingsQuery';
import { categoryLabel } from '@/services/catalog';
import { locationLookup } from '@/services/location';
import type { CatalogProductCard } from '@/types';

export type ListingsQuery = {
  q?: string | null;
  category?: string | null;
  breed?: string | null;
  province?: string | null;
  min?: string | null;
  max?: string | null;
  urgent?: string | null;
};

type ListingsViewProps = {
  query: ListingsQuery;
};

/** BE sonrası kalan UI filtreleri (fiyat, acil, ırk, metin). */
function applyClientFilters(
  all: CatalogProductCard[],
  filters: ListingsFiltersState,
  q: string
): CatalogProductCard[] {
  let list = all;

  if (filters.urgentOnly) {
    list = list.filter((p) => p.isUrgent);
  }

  if (filters.breed) {
    const needle = filters.breed.toLowerCase();
    list = list.filter((p) => (p.brand ?? '').toLowerCase() === needle);
  }

  if (filters.priceMinTl != null || filters.priceMaxTl != null) {
    list = list.filter((p) => {
      if (!p.price) return false;
      return matchesPrice(
        p.price.amountMinor,
        filters.priceMinTl,
        filters.priceMaxTl
      );
    });
  }

  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((p) => {
      const hay = `${p.title} ${p.brand ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }

  return list;
}

/** İlanlar sayfası — BE arama + sol filtre + kart grid. */
export const ListingsView = memo(function ListingsView({
  query,
}: ListingsViewProps) {
  const router = useRouter();
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const { session } = useAuthSession();
  const { banners: searchBanners } = usePlacementBanners('SEARCH');

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const bg = useThemeColor('background');
  const { facets, categoryTree } = useCatalogFacets();
  const { apply, remember, toggle } = useFavorites();

  const [filters, setFilters] = useState<ListingsFiltersState>({
    categorySlug: query.category ?? null,
    breed: query.breed ?? null,
    urgentOnly: query.urgent === '1',
    provinceIds: parseProvinceParam(query.province),
    priceMinTl: parseTlParam(query.min),
    priceMaxTl: parseTlParam(query.max),
  });
  const [page, setPage] = useState(0);
  const [liveQuery, setLiveQuery] = useState(query.q ?? '');
  const [locationTick, setLocationTick] = useState(0);
  const skipHydrate = useRef(false);

  useEffect(() => {
    if (skipHydrate.current) {
      skipHydrate.current = false;
      return;
    }
    setLiveQuery(query.q ?? '');
    setFilters({
      categorySlug: query.category ?? null,
      breed: query.breed ?? null,
      provinceIds: parseProvinceParam(query.province),
      priceMinTl: parseTlParam(query.min),
      priceMaxTl: parseTlParam(query.max),
      urgentOnly: query.urgent === '1',
    });
    setPage(0);
  }, [
    query.category,
    query.breed,
    query.q,
    query.province,
    query.min,
    query.max,
    query.urgent,
  ]);

  const search = usePublishedAdvertsSearch(
    {
      categorySlug: filters.categorySlug,
      provinceIds: filters.provinceIds,
    },
    categoryTree,
    session?.accessToken ?? null
  );

  const q = liveQuery.trim();

  const items = useMemo(
    () => apply(applyClientFilters(search.items, filters, q)),
    [apply, search.items, filters, q]
  );

  useEffect(() => {
    remember(items);
  }, [remember, items]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const provinces = await locationLookup.listProvinces();
        const needed = new Set(
          search.items.map((i) => i.provinceId).filter(Boolean)
        );
        await Promise.all(
          provinces
            .filter((p) => needed.has(p.id))
            .map((p) => locationLookup.listDistricts(p.id))
        );
        if (!cancelled) setLocationTick((n) => n + 1);
      } catch {
        /* konum isimleri opsiyonel */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search.items]);

  const syncUrl = useCallback(
    (next: ListingsFiltersState, searchText = liveQuery) => {
      const params = new URLSearchParams();
      const trimmed = searchText.trim();
      if (trimmed) params.set('q', trimmed);
      if (next.categorySlug) params.set('category', next.categorySlug);
      if (next.breed) params.set('breed', next.breed);
      const provinces = serializeProvinceParam(next.provinceIds);
      if (provinces) params.set('province', provinces);
      if (next.priceMinTl != null) params.set('min', String(next.priceMinTl));
      if (next.priceMaxTl != null) params.set('max', String(next.priceMaxTl));
      if (next.urgentOnly) params.set('urgent', '1');
      skipHydrate.current = true;
      syncListingsQuery(params.toString(), router);
    },
    [liveQuery, router]
  );

  const onLiveQueryChange = useCallback((next: string) => {
    setLiveQuery(next);
    setPage(0);
  }, []);

  const clearSearch = useCallback(() => {
    Keyboard.dismiss();
    if (!liveQuery && !query.q) return;
    setLiveQuery('');
    setPage(0);
    if (query.q) {
      const params = new URLSearchParams();
      if (filters.categorySlug) params.set('category', filters.categorySlug);
      if (filters.breed) params.set('breed', filters.breed);
      const provinces = serializeProvinceParam(filters.provinceIds);
      if (provinces) params.set('province', provinces);
      if (filters.priceMinTl != null) params.set('min', String(filters.priceMinTl));
      if (filters.priceMaxTl != null) params.set('max', String(filters.priceMaxTl));
      if (filters.urgentOnly) params.set('urgent', '1');
      skipHydrate.current = true;
      syncListingsQuery(params.toString(), router);
    }
  }, [
    filters.breed,
    filters.categorySlug,
    filters.priceMaxTl,
    filters.priceMinTl,
    filters.provinceIds,
    filters.urgentOnly,
    liveQuery,
    query.q,
    router,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPointerDown = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest) return;
      if (
        t.closest(
          '[data-keep-search="true"], #haradan-search-bar, #haradan-listings-filters, #haradan-listings-pager, #haradan-site-footer, header, [role="banner"]'
        )
      ) {
        return;
      }
      clearSearch();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [clearSearch]);

  const onFilterChange = useCallback(
    (next: ListingsFiltersState) => {
      setFilters(next);
      setPage(0);
      syncUrl(next);
    },
    [syncUrl]
  );

  const onProductPress = useCallback(
    (id: string) => {
      router.push(`/advert/${id}`);
    },
    [router]
  );

  const contextLabel =
    categoryLabel(categoryTree, filters.categorySlug) ||
    filters.breed ||
    (q ? `"${q}"` : null);

  const consumePress = useCallback(() => {}, []);

  const searchBar = (
    <Pressable onPress={consumePress}>
      <HomeSearchBar
        initialQuery={liveQuery}
        onQueryChange={onLiveQueryChange}
        live
        fullWidth
        compact
      />
    </Pressable>
  );

  const gridKey = `loc-${locationTick}`;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: bg },
        Platform.OS === 'web' ? ({ overflowAnchor: 'none' } as object) : null,
      ]}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={Platform.OS === 'web' ? undefined : clearSearch}
          style={styles.contentPress}
        >
          <HomeContentContainer style={styles.containerFlex}>
            <View style={[styles.body, !isWide && styles.bodyStack]}>
              {!isWide ? searchBar : null}

              <Pressable
                onPress={consumePress}
                style={[styles.sidebar, !isWide && styles.sidebarStack]}
              >
                <ListingsFilterSidebar
                  facets={facets}
                  value={filters}
                  onChange={onFilterChange}
                  resultCount={items.length}
                />
              </Pressable>

              <View style={styles.main}>
                {isWide ? searchBar : null}

                <View style={styles.pageHead}>
                  <Text style={[styles.pageTitle, { color: text }]}>
                    İlanlar
                  </Text>
                  <Text style={[styles.pageSub, { color: textMuted }]}>
                    {search.loading
                      ? 'Yükleniyor…'
                      : `${items.length} sonuç`}
                    {!search.loading && contextLabel
                      ? ` · ${contextLabel}`
                      : ''}
                  </Text>
                </View>

                <ListingsSearchBanner banner={searchBanners[0] ?? null} />

                {search.loading && items.length === 0 ? (
                  <View style={styles.center}>
                    <ActivityIndicator />
                  </View>
                ) : search.error && items.length === 0 ? (
                  <View style={styles.center}>
                    <Text style={[styles.error, { color: text }]}>
                      {search.error}
                    </Text>
                    <Pressable onPress={() => void search.refetch()}>
                      <Text style={[styles.retry, { color: textMuted }]}>
                        Tekrar dene
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <ListingsGrid
                    key={gridKey}
                    items={items}
                    page={page}
                    onPageChange={setPage}
                    onProductPress={onProductPress}
                    onToggleFavorite={toggle}
                  />
                )}
              </View>
            </View>
          </HomeContentContainer>

          <Pressable onPress={consumePress} style={styles.footerWrap}>
            <SiteFooter
              onNavPress={(key) => {
                if (key === 'listings') router.push('/listings');
              }}
            />
          </Pressable>
        </Pressable>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  contentPress: {
    flex: 1,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  containerFlex: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
  },
  footerWrap: {
    marginTop: 'auto',
    width: '100%',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    flex: 1,
  },
  bodyStack: { flexDirection: 'column' },
  sidebar: { width: 260, flexShrink: 0 },
  sidebarStack: { width: '100%' },
  main: { flex: 1, minWidth: 0, gap: Spacing.md },
  pageHead: { gap: 4, marginBottom: Spacing.sm },
  pageTitle: { fontSize: 22, fontWeight: '700' },
  pageSub: { fontSize: 13 },
  center: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 12,
  },
  error: { fontSize: 15, textAlign: 'center' },
  retry: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
