import type { CatalogFacets, CategoryTreeNode } from '@/types';

/**
 * Katalog sözleşmesi (DIP).
 * Mock → HttpCatalogRepository ile değişir; filtre UI’si aynı kalır.
 */
export interface ICatalogRepository {
  getFacets(): Promise<CatalogFacets>;
  getCategoryTree(): Promise<CategoryTreeNode[]>;
  getCachedFacets(): CatalogFacets | null;
  getCachedCategoryTree(): CategoryTreeNode[] | null;
}
