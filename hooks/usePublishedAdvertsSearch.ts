import { useCallback, useEffect, useMemo, useState } from 'react';
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

/**
 * İlanlar araması — server filtreleri (kategori / il) BE’den;
 * cache-first değil, filtre değişince yeniden çeker.
 */
export function usePublishedAdvertsSearch(
  filters: PublishedSearchFilters,
  categoryTree: CategoryTreeNode[],
  accessToken: string | null = null,
  repo: IPublishedAdvertsRepository = publishedAdvertsRepository
) {
  const [items, setItems] = useState<CatalogProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const provinceKey = filters.provinceIds.slice().sort().join(',');

  const resolved = useMemo(
    () => resolveSearchCategoryIds(categoryTree, filters.categorySlug),
    [categoryTree, filters.categorySlug]
  );

  const categoryIdsKey = (resolved.serverCategoryIds ?? []).join(',');
  const clientCategoryKey = resolved.clientCategoryIds
    ? [...resolved.clientCategoryIds].sort().join(',')
    : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await repo.search({
        categoryIds: resolved.serverCategoryIds,
        provinceIds:
          filters.provinceIds.length > 0 ? filters.provinceIds : undefined,
        accessToken,
      });
      let filtered = next;
      if (resolved.clientCategoryIds) {
        filtered = next.filter((p) =>
          resolved.clientCategoryIds!.has(p.categoryId)
        );
      }
      setItems(filtered);
      setError(null);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [
    repo,
    categoryIdsKey,
    clientCategoryKey,
    provinceKey,
    accessToken,
    resolved.serverCategoryIds,
    resolved.clientCategoryIds,
    filters.provinceIds,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    loading,
    error,
    refetch: load,
  };
}
