import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryTreeNode,
  CategoryTreeResponse,
} from '@/types';

import { HttpClient } from '@/services/http';
import type { CatalogQueryOptions, ICatalogRepository } from './CatalogRepository';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';

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
    const res = await this.http.request<CategoryTreeResponse>('/v1/categories', {
      method: 'GET',
    });
    if (res && Array.isArray(res.items)) {
      this.tree = res.items;
      return this.tree;
    }
    return [];
  }

  async getCategoryFormDefinition(
    categoryId: string,
    options?: CatalogQueryOptions & { categorySlug?: string }
  ): Promise<CategoryFormDefinitionResponse | null> {
    if (!categoryId && !options?.categorySlug) return null;

    const targetId = categoryId || options?.categorySlug || '';
    const targetSlug = options?.categorySlug || categoryId || '';

    if (this.formCache.has(targetId) && !options?.fresh) {
      return this.formCache.get(targetId) ?? null;
    }

    let resolvedUUID: string | null = null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      resolvedUUID = targetId;
    } else {
      const tree = await this.getCategoryTree();
      const findUUID = (nodes: CategoryTreeNode[]): string | null => {
        for (const node of nodes) {
          if (
            node.slug === targetSlug ||
            node.slug === targetId ||
            node.id === targetId ||
            node.slug === targetId.replace(/^cat-/, '')
          ) {
            return node.id;
          }
          if (node.children && node.children.length > 0) {
            const res = findUUID(node.children);
            if (res) return res;
          }
        }
        return null;
      };
      resolvedUUID = findUUID(tree);
    }

    if (!resolvedUUID) {
      return null;
    }

    const res = await this.http.request<CategoryFormDefinitionResponse>(
      `/v1/categories/${resolvedUUID}/form`,
      { method: 'GET' }
    );

    if (res && Array.isArray(res.properties)) {
      const response: CategoryFormDefinitionResponse = {
        categoryId: res.categoryId || resolvedUUID,
        slug: res.slug || targetSlug,
        name: res.name,
        properties: res.properties,
      };
      this.formCache.set(targetId, response);
      if (targetSlug && targetSlug !== targetId) {
        this.formCache.set(targetSlug, response);
      }
      this.formCache.set(resolvedUUID, response);
      return response;
    }

    return null;
  }

  async getFacets(options?: CatalogQueryOptions): Promise<CatalogFacets> {
    if (this.facets && !options?.fresh) {
      return this.facets;
    }
    const tree = await this.getCategoryTree(options);
    this.facets = mapCategoryTreeToFacets(tree);
    return this.facets;
  }
}


