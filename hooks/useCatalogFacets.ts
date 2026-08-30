import { useEffect, useState } from 'react';
import {
  catalogRepository,
  type ICatalogRepository,
} from '@/services/catalog';
import type { CatalogFacets, CategoryTreeNode } from '@/types';

/**
 * Katalog facet’leri — cache-first.
 * Tek HTTP: getCategoryTree; facets ağaçtan türetilir (çift /v1/categories yok).
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
  const [loading, setLoading] = useState(
    () => repo.getCachedCategoryTree() == null
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const tree = await repo.getCategoryTree();
        if (cancelled) return;
        // Facets tree cache üzerinden — ikinci /v1/categories yok
        const nextFacets = await repo.getFacets();
        if (cancelled) return;
        setFacets(nextFacets);
        setCategoryTree(tree);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Katalog yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
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
    loading,
    isReady: facets != null,
  };
}
