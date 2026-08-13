import { useEffect, useState } from 'react';
import {
  catalogRepository,
  type ICatalogRepository,
} from '@/services/catalog';
import type { CatalogFacets, CategoryTreeNode } from '@/types';

/**
 * Katalog facet’leri — cache-first.
 * Repo enjekte edilir (test / HttpCatalogRepository).
 */
export function useCatalogFacets(
  repo: ICatalogRepository = catalogRepository
) {
  const [facets, setFacets] = useState<CatalogFacets | null>(() =>
    repo.getCachedFacets()
  );
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(
    () => repo.getCachedCategoryTree() ?? []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [nextFacets, tree] = await Promise.all([
          repo.getFacets(),
          repo.getCategoryTree(),
        ]);
        if (cancelled) return;
        setFacets(nextFacets);
        setCategoryTree(tree);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Katalog yüklenemedi.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  return {
    facets,
    categoryTree,
    error,
    isReady: facets != null,
  };
}
