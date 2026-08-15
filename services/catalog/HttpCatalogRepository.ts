import type { CatalogFacets, CategoryTreeNode, CategoryTreeResponse } from '@/types';
import { HttpClient } from '@/services/http';
import type { ICatalogRepository } from './CatalogRepository';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';

/** CATALOG-01 — GET /v1/categories */
export class HttpCatalogRepository implements ICatalogRepository {
  private readonly http: HttpClient;
  private facets: CatalogFacets | null = null;
  private tree: CategoryTreeNode[] | null = null;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  getCachedFacets(): CatalogFacets | null {
    return this.facets;
  }

  getCachedCategoryTree(): CategoryTreeNode[] | null {
    return this.tree;
  }

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const res = await this.http.request<CategoryTreeResponse>('/v1/categories', {
      method: 'GET',
    });
    this.tree = res.items ?? [];
    return this.tree;
  }

  async getFacets(): Promise<CatalogFacets> {
    const tree = this.tree ?? (await this.getCategoryTree());
    this.facets = mapCategoryTreeToFacets(tree);
    return this.facets;
  }
}
