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
  type PansiyonFacilityFilters,
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
  matchesDatePeriod,
  matchesPrice,
  parseArrayParam,
  parseProvinceParam,
  parseTlParam,
  serializeArrayParam,
  serializeProvinceParam,
  type ListingPeriodFilter,
} from '@/components/listings/filterConfig';
import { syncListingsQuery } from '@/components/listings/syncListingsQuery';
import { categoryLabel, collectCategoryIds } from '@/services/catalog';
import { locationLookup } from '@/services/location';
import { normalizeSearchText } from '@/services/adverts';
import type { CatalogProductCard, CategoryTreeNode } from '@/types';

export type ListingsQuery = {
  q?: string | null;
  category?: string | null;
  breed?: string | null;
  province?: string | null;
  district?: string | null;
  min?: string | null;
  max?: string | null;
  urgent?: string | null;
  period?: string | null;
  facilities?: string | null;
  breeds?: string | null;
  ages?: string | null;
  colors?: string | null;
  genders?: string | null;
  features?: string | null;
};

type ListingsViewProps = {
  query: ListingsQuery;
};

function serializeFacilities(fac: PansiyonFacilityFilters): string | null {
  const active = (Object.keys(fac) as (keyof PansiyonFacilityFilters)[]).filter(
    (k) => Boolean(fac[k])
  );
  return active.length > 0 ? active.join(',') : null;
}

function parseFacilities(raw: string | null | undefined): PansiyonFacilityFilters {
  if (!raw) return {};
  const map: PansiyonFacilityFilters = {};
  const keys = raw.split(',').map((s) => s.trim());
  const validKeys: Record<string, keyof PansiyonFacilityFilters> = {
    grassPaddock: 'grassPaddock',
    sandPaddock: 'sandPaddock',
    stallionPaddock: 'stallionPaddock',
    vet: 'vet',
    farrier: 'farrier',
    foalingBarn: 'foalingBarn',
  };
  keys.forEach((k) => {
    if (validKeys[k]) {
      map[validKeys[k]] = true;
    }
  });
  return map;
}

/** BE sonrası kalan UI filtreleri (kategori, konum, fiyat, acil, periyot, ırk, yaş, don, metin). */
function applyClientFilters(
  all: CatalogProductCard[],
  filters: ListingsFiltersState,
  q: string,
  categoryTree?: CategoryTreeNode[]
): CatalogProductCard[] {
  let list = all;

  // 1. Kategori
  if (filters.categorySlug && categoryTree && categoryTree.length > 0) {
    const ids = collectCategoryIds(categoryTree, filters.categorySlug);
    if (ids && ids.size > 0) {
      list = list.filter(
        (p) => ids.has(p.categoryId) || p.categoryId === filters.categorySlug
      );
    }
  }

  // 2. İl
  if (filters.provinceIds && filters.provinceIds.length > 0) {
    const provSet = new Set(filters.provinceIds);
    list = list.filter((p) => provSet.has(p.provinceId));
  }

  // 3. İlçe
  if (filters.districtId) {
    list = list.filter((p) => p.districtId === filters.districtId);
  }

  // 4. Durum (Acil)
  if (filters.urgentOnly) {
    list = list.filter((p) => p.isUrgent);
  }

  // 5. İlan Tarihi (Periyot)
  if (filters.period) {
    list = list.filter((p) => matchesDatePeriod(p.publishedAt, filters.period));
  }

  // 6. Fiyat Aralığı
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

  // 7. Tekil Irk (Breed - Satılık Atlar / Genel)
  if (filters.breed) {
    const needle = normalizeSearchText(filters.breed);
    list = list.filter((p) => normalizeSearchText(p.brand) === needle);
  }

  // 8. Çoklu Irk (Aşım Hizmetleri - Arap / İngiliz)
  if (filters.breeds && filters.breeds.length > 0) {
    const normalizedBreeds = filters.breeds.map(normalizeSearchText);
    list = list.filter((p) => {
      const normBrand = normalizeSearchText(p.brand);
      const normTitle = normalizeSearchText(p.title);
      return normalizedBreeds.some((b) => {
        if (b === 'arap') {
          return (
            normBrand.includes('arab') ||
            normTitle.includes('arap') ||
            p.categoryId === 'cat-arap-aygir'
          );
        }
        if (b === 'ingiliz') {
          return (
            normBrand.includes('thorough') ||
            normTitle.includes('ingiliz') ||
            p.categoryId === 'cat-ingiliz-aygir'
          );
        }
        return normBrand.includes(b) || normTitle.includes(b);
      });
    });
  }

  // 9. Çoklu Yaş
  if (filters.ages && filters.ages.length > 0) {
    list = list.filter((p) => {
      const normTitle = normalizeSearchText(p.title);
      return filters.ages.some((age) => {
        if (age === '5+') {
          const match = normTitle.match(/(\d+)\s*ya/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num >= 5;
          }
          return false;
        }
        return normTitle.includes(`${age} ya`) || normTitle.includes(`${age}ya`);
      });
    });
  }

  // 10. Çoklu Don / Renk
  if (filters.colors && filters.colors.length > 0) {
    const normalizedColors = filters.colors.map(normalizeSearchText);
    list = list.filter((p) => {
      const normTitle = normalizeSearchText(p.title);
      return normalizedColors.some((c) => normTitle.includes(c));
    });
  }

  // 11. Cinsiyet (Erkek, Dişi, İğdiş)
  if (filters.genders && filters.genders.length > 0) {
    const normalizedGenders = filters.genders.map(normalizeSearchText);
    list = list.filter((p) => {
      const normTitle = normalizeSearchText(p.title);
      const normBrand = normalizeSearchText(p.brand ?? '');
      return normalizedGenders.some(
        (g) => normTitle.includes(g) || normBrand.includes(g)
      );
    });
  }

  // 12. Donanım / Hizmet Özellikleri (Nakliye, Nalbant, Aşım)
  if (filters.features && filters.features.length > 0) {
    const featureKeywords: Record<string, string[]> = {
      camera: ['kamera', 'izleme'],
      ac: ['klima', 'iklimlendirme', 'havalandirma'],
      airSuspension: ['havali', 'suspansiyon'],
      insurance: ['sigorta', 'sigortali', 'kasko'],
      hotShoeing: ['sicak', 'ocak', 'dovme'],
      orthopedic: ['ortopedik', 'aci', 'duzeltme'],
      mobileService: ['mobil', 'yerinde', 'adrese'],
      crackTreatment: ['catlak', 'tedavi', 'tirnak'],
      liveFoal: ['canli tay', 'tay garantisi', 'garanti'],
      marePension: ['pansiyon', 'kisrak'],
      ultrasound: ['ultrason', 'muayene', 'veteriner'],
    };
    list = list.filter((p) => {
      const hay = normalizeSearchText(`${p.title} ${p.brand ?? ''}`);
      return (filters.features ?? []).every((fKey) => {
        const keywords = featureKeywords[fKey] ?? [fKey];
        return keywords.some((kw) => hay.includes(kw));
      });
    });
  }

  // 13. Canlı Arama Metni
  if (q) {
    const needle = normalizeSearchText(q);
    if (needle) {
      list = list.filter((p) => {
        const hay = normalizeSearchText(`${p.title} ${p.brand ?? ''}`);
        return hay.includes(needle);
      });
    }
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
    districtId: query.district ?? null,
    priceMinTl: parseTlParam(query.min),
    priceMaxTl: parseTlParam(query.max),
    period: (query.period as ListingPeriodFilter) ?? null,
    facilities: parseFacilities(query.facilities),
    breeds: parseArrayParam(query.breeds),
    ages: parseArrayParam(query.ages),
    colors: parseArrayParam(query.colors),
    genders: parseArrayParam(query.genders),
    features: parseArrayParam(query.features),
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
      districtId: query.district ?? null,
      priceMinTl: parseTlParam(query.min),
      priceMaxTl: parseTlParam(query.max),
      urgentOnly: query.urgent === '1',
      period: (query.period as ListingPeriodFilter) ?? null,
      facilities: parseFacilities(query.facilities),
      breeds: parseArrayParam(query.breeds),
      ages: parseArrayParam(query.ages),
      colors: parseArrayParam(query.colors),
      genders: parseArrayParam(query.genders),
      features: parseArrayParam(query.features),
    });
    setPage(0);
  }, [
    query.category,
    query.breed,
    query.q,
    query.province,
    query.district,
    query.min,
    query.max,
    query.urgent,
    query.period,
    query.facilities,
    query.breeds,
    query.ages,
    query.colors,
    query.genders,
    query.features,
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
    () => apply(applyClientFilters(search.items, filters, q, categoryTree)),
    [apply, search.items, filters, q, categoryTree]
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
      if (next.districtId) params.set('district', next.districtId);
      if (next.priceMinTl != null) params.set('min', String(next.priceMinTl));
      if (next.priceMaxTl != null) params.set('max', String(next.priceMaxTl));
      if (next.urgentOnly) params.set('urgent', '1');
      if (next.period) params.set('period', next.period);
      const facStr = serializeFacilities(next.facilities);
      if (facStr) params.set('facilities', facStr);
      const breedsStr = serializeArrayParam(next.breeds);
      if (breedsStr) params.set('breeds', breedsStr);
      const agesStr = serializeArrayParam(next.ages);
      if (agesStr) params.set('ages', agesStr);
      const colorsStr = serializeArrayParam(next.colors);
      if (colorsStr) params.set('colors', colorsStr);
      const gendersStr = serializeArrayParam(next.genders ?? []);
      if (gendersStr) params.set('genders', gendersStr);
      const featuresStr = serializeArrayParam(next.features ?? []);
      if (featuresStr) params.set('features', featuresStr);

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
      if (filters.districtId) params.set('district', filters.districtId);
      if (filters.priceMinTl != null) params.set('min', String(filters.priceMinTl));
      if (filters.priceMaxTl != null) params.set('max', String(filters.priceMaxTl));
      if (filters.urgentOnly) params.set('urgent', '1');
      if (filters.period) params.set('period', filters.period);
      const facStr = serializeFacilities(filters.facilities);
      if (facStr) params.set('facilities', facStr);
      const breedsStr = serializeArrayParam(filters.breeds);
      if (breedsStr) params.set('breeds', breedsStr);
      const agesStr = serializeArrayParam(filters.ages);
      if (agesStr) params.set('ages', agesStr);
      const colorsStr = serializeArrayParam(filters.colors);
      if (colorsStr) params.set('colors', colorsStr);

      skipHydrate.current = true;
      syncListingsQuery(params.toString(), router);
    }
  }, [
    filters,
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
                    {contextLabel
                      ? `${contextLabel} · ${items.length} ilan listeleniyor`
                      : `${items.length} ilan listeleniyor`}
                  </Text>
                </View>

                {searchBanners[0] ? (
                  <ListingsSearchBanner banner={searchBanners[0]} />
                ) : null}

                {search.loading ? (
                  <View style={styles.loader}>
                    <ActivityIndicator size="large" color={textMuted} />
                  </View>
                ) : search.error ? (
                  <View style={styles.errorBox}>
                    <Text style={[styles.errorTitle, { color: text }]}>
                      İlanlar yüklenemedi
                    </Text>
                    <Text style={[styles.errorSub, { color: textMuted }]}>
                      {search.error}
                    </Text>
                    <Pressable
                      onPress={search.retry}
                      accessibilityRole="button"
                      accessibilityLabel="Yeniden dene"
                      style={({ pressed }) => [
                        styles.retryBtn,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[styles.retryText, { color: text }]}>
                        Yeniden dene
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
        </Pressable>
        <SiteFooter />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  contentPress: { flex: 1 },
  containerFlex: { flex: 1 },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  bodyStack: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  sidebar: {
    width: 256,
    flexShrink: 0,
  },
  sidebarStack: {
    width: '100%',
  },
  main: {
    flex: 1,
    gap: Spacing.md,
    minWidth: 0,
  },
  pageHead: {
    gap: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 13,
  },
  loader: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorSub: {
    fontSize: 13,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
