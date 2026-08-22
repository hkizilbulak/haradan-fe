import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryTreeNode,
} from '@/types';

export interface CatalogQueryOptions {
  fresh?: boolean;
}

/**
 * Katalog sözleşmesi (DIP).
 * Mock → HttpCatalogRepository ile değişir; filtre UI’si aynı kalır.
 */
export interface ICatalogRepository {
  getFacets(options?: CatalogQueryOptions): Promise<CatalogFacets>;
  getCategoryTree(options?: CatalogQueryOptions): Promise<CategoryTreeNode[]>;
  getCategoryFormDefinition(
    categoryId: string,
    options?: CatalogQueryOptions
  ): Promise<CategoryFormDefinitionResponse | null>;
  getCachedFacets(): CatalogFacets | null;
  getCachedCategoryTree(): CategoryTreeNode[] | null;
  invalidate(): void;
}


