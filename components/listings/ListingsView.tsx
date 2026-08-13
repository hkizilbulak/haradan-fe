import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ListingsFilterSidebar,
  type ListingsFiltersState,
} from '@/components/listings/ListingsFilterSidebar';
import { ListingsGrid } from '@/components/listings/ListingsGrid';
import { HomeSearchBar, SiteFooter } from '@/components/home';
import { HomeContentContainer } from '@/components/layout';
import { HOME_DESKTOP_BREAKPOINT } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useCatalogFacets } from '@/hooks/useCatalogFacets';
import { useFavorites } from '@/hooks/useFavorites';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MOCK_CATALOG_PRODUCTS } from '@/mocks/homepage';
import {
  matchesPrice,
  parseProvinceParam,
  parseTlParam,
  serializeProvinceParam,
} from '@/components/listings/filterConfig';
import { syncListingsQuery } from '@/components/listings/syncListingsQuery';
import {
  categoryLabel,
  collectCategoryIds,
} from '@/services/catalog';
import type { CatalogProductCard, CategoryTreeNode } from '@/types';

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

function filterProducts(
  all: CatalogProductCard[],
  tree: CategoryTreeNode[],
  filters: ListingsFiltersState,
  q: string
): CatalogProductCard[] {
  let list = all;

  if (filters.urgentOnly) {
    list = list.filter((p) => p.isUrgent);
  }

  if (filters.breed) {
    list = list.filter(
      (p) => (p.brand ?? '').toLowerCase() === filters.breed!.toLowerCase()
    );
  }

  if (filters.categorySlug) {
    const ids = collectCategoryIds(tree, filters.categorySlug);
    if (ids) {
      list = list.filter((p) => ids.has(p.categoryId));
    }
  }

  if (filters.provinceIds.length > 0) {
    const set = new Set(filters.provinceIds);
    list = list.filter((p) => set.has(p.provinceId));
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

/** İlanlar sayfası — arama + sol filtre + 3 kolon grid. */
export const ListingsView = memo(function ListingsView({
  query,
}: ListingsViewProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

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

  const q = liveQuery.trim();

  const items = useMemo(
    () =>
      apply(filterProducts(MOCK_CATALOG_PRODUCTS, categoryTree, filters, q)),
    [categoryTree, filters, q, apply]
  );

  useEffect(() => {
    remember(items);
  }, [remember, items]);

  const syncUrl = useCallback(
    (next: ListingsFiltersState, search = liveQuery) => {
      const params = new URLSearchParams();
      const trimmed = search.trim();
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
          <HomeContentContainer>
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
                    {items.length} sonuç
                    {contextLabel ? ` · ${contextLabel}` : ''}
                  </Text>
                </View>

                <ListingsGrid
                  items={items}
                  page={page}
                  onPageChange={setPage}
                  onProductPress={onProductPress}
                  onToggleFavorite={toggle}
                />
              </View>
            </View>
          </HomeContentContainer>

          <Pressable onPress={consumePress}>
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
  content: { paddingTop: Spacing.lg, paddingBottom: 0, flexGrow: 1 },
  contentPress: { flexGrow: 1 },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.45,
  },
  pageSub: { fontSize: 13, fontWeight: '500' },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  bodyStack: { flexDirection: 'column' },
  sidebar: {
    width: 240,
    flexShrink: 0,
    ...Platform.select({
      web: { position: 'sticky' as 'relative', top: 20 },
      default: {},
    }),
  },
  sidebarStack: { width: '100%' },
  main: { flex: 1, minWidth: 0 },
});
