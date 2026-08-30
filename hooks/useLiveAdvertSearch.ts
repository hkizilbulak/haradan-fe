import { useCallback, useEffect, useRef, useState } from 'react';
import {
  filterAndRankAdverts,
  publishedAdvertsRepository,
  type IPublishedAdvertsRepository,
} from '@/services/adverts';
import { locationLookup as defaultLocationLookup, type ILocationLookup } from '@/services/location';
import { findCategoryById } from '@/services/catalog';
import type { CatalogProductCard, CategoryTreeNode } from '@/types';

export type UseLiveAdvertSearchOptions = {
  initialQuery?: string;
  limit?: number;
  debounceMs?: number;
  categoryTree?: CategoryTreeNode[];
  locationLookup?: ILocationLookup;
  repo?: IPublishedAdvertsRepository;
};

// Modül düzeyinde hafif önbellek — hızlı anlık filtreleme için
let advertsCache: CatalogProductCard[] | null = null;
let cacheTime = 0;
let inflight: Promise<CatalogProductCard[]> | null = null;
const CACHE_TTL_MS = 60_000; // 1 dakika

export function useLiveAdvertSearch({
  initialQuery = '',
  limit = 8,
  debounceMs = 200,
  categoryTree,
  locationLookup = defaultLocationLookup,
  repo = publishedAdvertsRepository,
}: UseLiveAdvertSearchOptions = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<CatalogProductCard[]>([]);
  const [allAdverts, setAllAdverts] = useState<CatalogProductCard[]>(
    advertsCache ?? []
  );
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const activeReqId = useRef(0);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, debounceMs]);

  /** İlk odak / ilk yazımda yükle — anasayfa açılışında /v1/adverts atılmaz. */
  const ensureLoaded = useCallback(async () => {
    const now = Date.now();
    if (advertsCache && now - cacheTime < CACHE_TTL_MS) {
      setAllAdverts(advertsCache);
      return advertsCache;
    }
    if (inflight) {
      const data = await inflight;
      setAllAdverts(data);
      return data;
    }

    inflight = (async () => {
      try {
        const data = await repo.search({ maxItems: 100 });
        advertsCache = data;
        cacheTime = Date.now();
        return data;
      } catch {
        return advertsCache ?? [];
      } finally {
        inflight = null;
      }
    })();

    const data = await inflight;
    setAllAdverts(data);
    return data;
  }, [repo]);

  // Filter resolver for extra fields (il, ilçe, kategori adı)
  const resolveExtra = useCallback(
    (advert: CatalogProductCard) => {
      const provinceName =
        advert.provinceName ||
        (advert.provinceId
          ? locationLookup.getProvinceName(advert.provinceId)
          : null);
      const districtName =
        advert.districtName ||
        (advert.districtId
          ? locationLookup.getDistrictName(advert.districtId)
          : null);
      const categoryName =
        categoryTree && advert.categoryId
          ? findCategoryById(categoryTree, advert.categoryId)?.name ?? null
          : null;

      return {
        provinceName,
        districtName,
        categoryName,
      };
    },
    [categoryTree, locationLookup]
  );

  // Perform search whenever debouncedQuery changes — fetch only when needed
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const reqId = ++activeReqId.current;
    setLoading(true);
    setIsOpen(true);

    const performFilter = (dataset: CatalogProductCard[]) => {
      if (reqId !== activeReqId.current) return;
      const filtered = filterAndRankAdverts(dataset, trimmed, {
        limit,
        resolveExtra,
      });
      setResults(filtered);
      setLoading(false);
    };

    if (allAdverts.length > 0) {
      performFilter(allAdverts);
      return;
    }

    ensureLoaded()
      .then((dataset) => performFilter(dataset))
      .catch(() => {
        if (reqId === activeReqId.current) {
          setResults([]);
          setLoading(false);
        }
      });
  }, [debouncedQuery, allAdverts, limit, resolveExtra, ensureLoaded]);

  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setIsOpen(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    if (query.trim()) {
      setIsOpen(true);
    }
  }, [query]);

  return {
    query,
    debouncedQuery,
    setQuery,
    results,
    totalCount: results.length,
    loading,
    isOpen,
    setIsOpen,
    clear,
    close,
    open,
    ensureLoaded,
  };
}
