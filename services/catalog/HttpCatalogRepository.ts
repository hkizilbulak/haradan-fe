import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryTreeNode,
  CategoryTreeResponse,
} from '@/types';
import { HttpClient } from '@/services/http';
import type { CatalogQueryOptions, ICatalogRepository } from './CatalogRepository';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';
import { MockCatalogRepository } from './MockCatalogRepository';

/** CATALOG-01 — GET /v1/categories, CATALOG-02 — GET /v1/categories/{categoryId}/form */
export class HttpCatalogRepository implements ICatalogRepository {
  private readonly http: HttpClient;
  private facets: CatalogFacets | null = null;
  private tree: CategoryTreeNode[] | null = null;
  private formCache = new Map<string, CategoryFormDefinitionResponse>();

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  getCachedFacets(): CatalogFacets | null {
    return this.facets;
  }

  getCachedCategoryTree(): CategoryTreeNode[] | null {
    return this.tree;
  }

  invalidate(): void {
    this.facets = null;
    this.tree = null;
    this.formCache.clear();
  }

  async getCategoryTree(options?: CatalogQueryOptions): Promise<CategoryTreeNode[]> {
    if (this.tree && !options?.fresh) {
      return this.tree;
    }
    try {
      const res = await this.http.request<CategoryTreeResponse>('/v1/categories', {
        method: 'GET',
      });
      if (res && Array.isArray(res.items)) {
        this.tree = res.items;
        return this.tree;
      }
      return new MockCatalogRepository().getCategoryTree();
    } catch {
      return new MockCatalogRepository().getCategoryTree();
    }
  }

  async getCategoryFormDefinition(
    categoryId: string,
    options?: CatalogQueryOptions
  ): Promise<CategoryFormDefinitionResponse | null> {
    if (!categoryId) return null;
    if (this.formCache.has(categoryId) && !options?.fresh) {
      return this.formCache.get(categoryId) ?? null;
    }
    try {
      const res = await this.http.request<CategoryFormDefinitionResponse>(
        `/v1/categories/${categoryId}/form`,
        { method: 'GET' }
      );
      if (res && Array.isArray(res.properties)) {
        this.formCache.set(categoryId, res);
        return res;
      }
      return new MockCatalogRepository().getCategoryFormDefinition(categoryId, options);
    } catch {
      return new MockCatalogRepository().getCategoryFormDefinition(categoryId, options);
    }
  }

  async getFacets(options?: CatalogQueryOptions): Promise<CatalogFacets> {
    if (this.facets && !options?.fresh) {
      return this.facets;
    }
    try {
      const tree = await this.getCategoryTree(options);
      this.facets = mapCategoryTreeToFacets(tree);
      return this.facets;
    } catch {
      return new MockCatalogRepository().getFacets();
    }
  }
}


