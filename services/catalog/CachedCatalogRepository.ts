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

  return {
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
        tree = result;
        treeInflight = null;
        return result;
      });
      return treeInflight;
    },

    async getCategoryFormDefinition(categoryId: string, options?: CatalogQueryOptions) {
      if (!categoryId) return null;
      if (options?.fresh) {
        formCache.delete(categoryId);
      }
      if (formCache.has(categoryId)) {
        return formCache.get(categoryId) ?? null;
      }
      if (formInflight.has(categoryId)) {
        return formInflight.get(categoryId)!;
      }
      const promise = inner.getCategoryFormDefinition(categoryId, options).then((res) => {
        formCache.set(categoryId, res);
        formInflight.delete(categoryId);
        return res;
      });
      formInflight.set(categoryId, promise);
      return promise;
    },
  };
}


