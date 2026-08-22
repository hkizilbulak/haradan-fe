import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryPropertyPublic,
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

    // Check browser localStorage for real-time changes from BO
    if (typeof window !== 'undefined') {
      try {
        const stored =
          localStorage.getItem(`haradan_category_properties_${categoryId}`) ||
          localStorage.getItem(`haradan_category_properties_cat-${categoryId}`) ||
          localStorage.getItem(`haradan_category_properties_${categoryId.replace(/^cat-/, '')}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const activeProps: CategoryPropertyPublic[] = parsed
              .filter((p: { isActive?: boolean }) => p.isActive !== false)
              .map((p: any) => ({
                code: p.code || p.id,
                title: p.title,
                helpText: p.helpText,
                dataType: p.dataType,
                isRequired: Boolean(p.isRequired),
                isFilterable: p.isFilterable !== false,
                sortOrder: p.sortOrder || 1,
                options: p.options || [],
              }));
            const res: CategoryFormDefinitionResponse = {
              categoryId,
              slug: categoryId,
              name: categoryId,
              properties: activeProps,
            };
            this.formCache.set(categoryId, res);
            return res;
          }
        }
      } catch {}
    }

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


