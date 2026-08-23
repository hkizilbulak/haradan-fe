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

    if (this.formCache.has(targetId) && !options?.fresh) {
      return this.formCache.get(targetId) ?? null;
    }

    // 1. Check browser localStorage first for real-time changes from BO
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

        // Include parent category keys if this is a child category (e.g. Satılık Yarış Atı -> Satılık Atlar)
        const tSlug = targetSlug.toLowerCase();
        if (
          tSlug.includes('yaris') ||
          tSlug.includes('kisrak') ||
          tSlug.includes('aygir') ||
          tSlug.includes('binek') ||
          tSlug.includes('pony') ||
          tSlug.includes('satilik')
        ) {
          candidateKeys.push('satilik-atlar', 'cat-satilik-atlar');
        } else if (tSlug.includes('pansiyon') || tSlug.includes('nakliye') || tSlug.includes('nalbant')) {
          candidateKeys.push('at-hizmetleri', 'cat-at-hizmetleri');
        } else if (tSlug.includes('asim') || tSlug.includes('arap') || tSlug.includes('ingiliz')) {
          candidateKeys.push('asim-hizmetleri', 'cat-asim-hizmetleri');
        }

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

              // If stored properties only contain custom fields, merge core default properties
              const defaultDef = await new MockCatalogRepository().getCategoryFormDefinition(
                targetSlug || targetId
              );
              const defaultProps = defaultDef?.properties || [];
              const existingCodes = new Set(activeProps.map((p) => (p.code || p.title).toLowerCase()));
              for (const defProp of defaultProps) {
                const defKey = (defProp.code || defProp.title).toLowerCase();
                if (!existingCodes.has(defKey)) {
                  activeProps.push(defProp);
                }
              }
              activeProps.sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));

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

    // 2. Try live backend API request
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
          const activeProps = res.properties.filter(
            (p: any) =>
              p.isActive !== false &&
              p.is_active !== false &&
              p.active !== false &&
              p.isFilterable !== false &&
              p.is_filterable !== false
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


