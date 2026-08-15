import type { CatalogFacets, CategoryTreeNode } from '@/types';
import { MOCK_CATEGORIES } from '@/mocks/homepage';
import type { ICatalogRepository } from './CatalogRepository';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';

/**
 * Mock katalog — homepage kategori ağacından facet üretir.
 * HttpCatalogRepository: GET /v1/catalog/facets
 */
export class MockCatalogRepository implements ICatalogRepository {
  getCachedFacets(): CatalogFacets | null {
    return null;
  }

  getCachedCategoryTree(): CategoryTreeNode[] | null {
    return null;
  }

  async getFacets(): Promise<CatalogFacets> {
    return mapCategoryTreeToFacets(MOCK_CATEGORIES);
  }

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    return MOCK_CATEGORIES;
  }
}
