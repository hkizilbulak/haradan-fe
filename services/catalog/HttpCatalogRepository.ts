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
    options?: CatalogQueryOptions & { categorySlug?: string }
  ): Promise<CategoryFormDefinitionResponse | null> {
    if (!categoryId && !options?.categorySlug) return null;

    const targetId = categoryId || options?.categorySlug || '';
    const targetSlug = options?.categorySlug || categoryId || '';

    const getDeletedKeys = (cat: string): Set<string> => {
      const set = new Set<string>();
      if (typeof window === 'undefined') return set;
      try {
        const keys = [
          cat,
          `cat-${cat}`,
          cat.replace(/^cat-/, ''),
          targetSlug,
          `cat-${targetSlug}`,
          targetSlug.replace(/^cat-/, ''),
        ];
        for (const k of keys) {
          const raw = localStorage.getItem(`haradan_deleted_props_${k}`);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              arr.forEach((item) => set.add(String(item).toLowerCase()));
            }
          }
        }
      } catch {}
      return set;
    };

    if (this.formCache.has(targetId) && !options?.fresh) {
      return this.formCache.get(targetId) ?? null;
    }

    // 1. Try live backend API request first (Direct from Database)
    try {
      let resolvedUUID = targetId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (!isUUID) {
        const tree = await this.getCategoryTree();
        const findUUID = (nodes: CategoryTreeNode[]): string | null => {
          for (const node of nodes) {
            if (node.slug === targetSlug || node.slug === targetId || node.id === targetId) {
              return node.id;
            }
            if (node.children && node.children.length > 0) {
              const res = findUUID(node.children);
              if (res) return res;
            }
          }
          return null;
        };
        const found = findUUID(tree);
        if (found) resolvedUUID = found;
      }

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedUUID)) {
        const res = await this.http.request<CategoryFormDefinitionResponse>(
          `/v1/categories/${resolvedUUID}/form`,
          { method: 'GET' }
        );
        if (res && Array.isArray(res.properties)) {
          const deletedKeys = getDeletedKeys(targetId);
          const activeProps = res.properties.filter(
            (p: any) =>
              p.isActive !== false &&
              p.is_active !== false &&
              p.active !== false &&
              p.isFilterable !== false &&
              p.is_filterable !== false &&
              !deletedKeys.has((p.code || p.id || '').toLowerCase()) &&
              !deletedKeys.has((p.title || '').toLowerCase())
          );
          const filteredRes: CategoryFormDefinitionResponse = {
            ...res,
            properties: activeProps,
          };
          this.formCache.set(targetId, filteredRes);
          return filteredRes;
        }
      }
    } catch {
      // API fallback
    }

    // 2. Check browser localStorage fallback for offline / mock testing
    if (typeof window !== 'undefined') {
      try {
        const candidateKeys = [
          targetId,
          targetSlug,
          `cat-${targetId}`,
          `cat-${targetSlug}`,
          targetId.replace(/^cat-/, ''),
          targetSlug.replace(/^cat-/, ''),
        ];

        for (const k of candidateKeys) {
          if (!k) continue;
          const stored = localStorage.getItem(`haradan_category_properties_${k}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const activeProps: CategoryPropertyPublic[] = parsed
                .filter(
                  (p: any) =>
                    p.isActive !== false &&
                    p.is_active !== false &&
                    p.active !== false &&
                    p.isFilterable !== false &&
                    p.is_filterable !== false
                )
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
                categoryId: targetId,
                slug: targetSlug,
                name: targetSlug,
                properties: activeProps,
              };
              this.formCache.set(targetId, res);
              return res;
            }
          }
        }
      } catch {}
    }

    // 3. Fallback to mock catalog using slug or id
    return new MockCatalogRepository().getCategoryFormDefinition(targetSlug || targetId, options);
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


