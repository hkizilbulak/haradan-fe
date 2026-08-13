import type { CatalogFacets, CategoryTreeNode } from '@/types';
import type { ICatalogRepository } from './CatalogRepository';

/** Bellek önbelleği — HttpCatalogRepository gelince aynı sarmalayıcı kullanılır. */
export function createCachedCatalogRepository(
  inner: ICatalogRepository
): ICatalogRepository {
  let facets: CatalogFacets | null = null;
  let tree: CategoryTreeNode[] | null = null;
  let inflight: Promise<CatalogFacets> | null = null;
  let treeInflight: Promise<CategoryTreeNode[]> | null = null;

  return {
    getCachedFacets: () => facets,
    getCachedCategoryTree: () => tree,

    async getFacets() {
      if (facets) return facets;
      if (inflight) return inflight;
      inflight = inner.getFacets().then((result) => {
        facets = result;
        inflight = null;
        return result;
      });
      return inflight;
    },

    async getCategoryTree() {
      if (tree) return tree;
      if (treeInflight) return treeInflight;
      treeInflight = inner.getCategoryTree().then((result) => {
        tree = result;
        treeInflight = null;
        return result;
      });
      return treeInflight;
    },
  };
}
