import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryTreeNode,
} from '@/types';
import type { CatalogQueryOptions, ICatalogRepository } from './CatalogRepository';

/** Bellek önbelleği — HttpCatalogRepository gelince aynı sarmalayıcı kullanılır. */
export function createCachedCatalogRepository(
  inner: ICatalogRepository
): ICatalogRepository {
  let facets: CatalogFacets | null = null;
  let tree: CategoryTreeNode[] | null = null;
  let inflight: Promise<CatalogFacets> | null = null;
  let treeInflight: Promise<CategoryTreeNode[]> | null = null;
  const formInflight = new Map<string, Promise<CategoryFormDefinitionResponse | null>>();
  const formCache = new Map<string, CategoryFormDefinitionResponse | null>();

  const repo: ICatalogRepository = {
    getCachedFacets: () => facets,
    getCachedCategoryTree: () => tree,
    invalidate: () => {
      facets = null;
      tree = null;
      formCache.clear();
      formInflight.clear();
      inner.invalidate?.();
    },

    async getFacets(options?: CatalogQueryOptions) {
      if (options?.fresh) {
        facets = null;
      }
      if (facets) return facets;
      if (inflight) return inflight;
      inflight = inner.getFacets(options).then((result) => {
        facets = result;
        inflight = null;
        return result;
      });
      return inflight;
    },

    async getCategoryTree(options?: CatalogQueryOptions) {
      if (options?.fresh) {
        tree = null;
      }
      if (tree) return tree;
      if (treeInflight) return treeInflight;
      treeInflight = inner.getCategoryTree(options).then((result) => {
        const filtered = (result || []).filter(
          (n) =>
            n.slug !== 'ortak-alanlar' &&
            n.slug !== 'cat-ortak-alanlar' &&
            n.id !== 'c1000000-0000-4000-8000-000000000000' &&
            !n.name?.toLowerCase().includes('ortak alan') &&
            !n.slug?.toLowerCase().includes('ortak')
        );
        tree = filtered;
        treeInflight = null;
        return filtered;
      });
      return treeInflight;
    },

    async getCategoryFormDefinition(categoryId: string, options?: CatalogQueryOptions) {
      if (!categoryId && !options?.categorySlug) return null;
      const targetKey = categoryId || options?.categorySlug || '';
      if (options?.fresh) {
        formCache.delete(categoryId);
        if (options?.categorySlug) {
          formCache.delete(options.categorySlug);
        }
      }
      if (formCache.has(targetKey)) {
        return formCache.get(targetKey) ?? null;
      }
      if (categoryId && formCache.has(categoryId)) {
        return formCache.get(categoryId) ?? null;
      }
      if (options?.categorySlug && formCache.has(options.categorySlug)) {
        return formCache.get(options.categorySlug) ?? null;
      }
      if (formInflight.has(targetKey)) {
        return formInflight.get(targetKey)!;
      }
      const promise = inner.getCategoryFormDefinition(categoryId, options).then((res) => {
        formCache.set(targetKey, res);
        if (categoryId && categoryId !== targetKey) formCache.set(categoryId, res);
        if (options?.categorySlug && options.categorySlug !== targetKey) formCache.set(options.categorySlug, res);
        formInflight.delete(targetKey);
        return res;
      });
      formInflight.set(targetKey, promise);
      return promise;
    },
  };

  if (typeof window !== 'undefined') {
    try {
      const bc = new BroadcastChannel('haradan_catalog_channel');
      bc.onmessage = () => {
        repo.invalidate?.();
      };
    } catch {}

    window.addEventListener('storage', () => {
      repo.invalidate?.();
    });
    window.addEventListener('haradan_catalog_data_changed', () => {
      repo.invalidate?.();
    });
  }

  return repo;
}


