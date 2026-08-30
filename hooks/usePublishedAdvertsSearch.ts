import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  publishedAdvertsRepository,
  resolveSearchCategoryIds,
  type IPublishedAdvertsRepository,
} from '@/services/adverts';
import type { CatalogProductCard, CategoryTreeNode } from '@/types';

export type PublishedSearchFilters = {
  categorySlug: string | null;
  provinceIds: string[];
};

export type UsePublishedAdvertsSearchOptions = {
  /** false iken istek atılmaz (SSR hydrate / kategori ağacı beklenirken). */
  enabled?: boolean;
};

/**
 * İlanlar araması — server filtreleri (kategori / il) BE’den.
 * Auth token repo içinde resolve edilir; session hydrate yüzünden çift istek yok.
 */
export function usePublishedAdvertsSearch(
  filters: PublishedSearchFilters,
  categoryTree: CategoryTreeNode[],
  _accessToken: string | null = null,
  repo: IPublishedAdvertsRepository = publishedAdvertsRepository,
  options: UsePublishedAdvertsSearchOptions = {}
) {
  const enabled = options.enabled !== false;
  const [items, setItems] = useState<CatalogProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const provinceKey = useMemo(
    () => filters.provinceIds.slice().sort().join(','),
    [filters.provinceIds]
  );

  const resolved = useMemo(
    () => resolveSearchCategoryIds(categoryTree, filters.categorySlug),
    [categoryTree, filters.categorySlug]
  );

  const categoryIdsKey = (resolved.serverCategoryIds ?? []).join(',');
  const clientCategoryKey = resolved.clientCategoryIds
    ? [...resolved.clientCategoryIds].sort().join(',')
    : '';

  // Kategori slug varken ağaç gelene kadar bekle — boş ağaçla gereksiz full search yok
  const waitingForTree = Boolean(filters.categorySlug) && categoryTree.length === 0;
  const canFetch = enabled && !waitingForTree;

  const load = useCallback(async () => {
    if (!canFetch) return;
    const id = ++reqId.current;
    setLoading(true);
    try {
      const next = await repo.search({
        categoryIds: resolved.serverCategoryIds,
        provinceIds:
          filters.provinceIds.length > 0 ? filters.provinceIds : undefined,
      });
      if (id !== reqId.current) return;
      let filtered = next;
      if (resolved.clientCategoryIds) {
        filtered = next.filter((p) =>
          resolved.clientCategoryIds!.has(p.categoryId)
        );
      }
      setItems(filtered);
      setError(null);
    } catch (err) {
      if (id !== reqId.current) return;
      setItems([]);
      setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [
    canFetch,
    repo,
    categoryIdsKey,
    clientCategoryKey,
    provinceKey,
    // resolved ids derived from keys above; keep stable values for search call
    resolved.serverCategoryIds,
    resolved.clientCategoryIds,
    filters.provinceIds,
  ]);

  useEffect(() => {
    if (!canFetch) {
      if (waitingForTree || !enabled) setLoading(true);
      return;
    }
    void load();
  }, [canFetch, waitingForTree, enabled, load]);

  return {
    items,
    loading,
    error,
    refetch: load,
  };
}
