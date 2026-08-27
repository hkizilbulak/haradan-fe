import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryPropertyPublic,
  CategoryTreeNode,
  CategoryTreeResponse,
} from '@/types';

import { HttpClient } from '@/services/http';
import type { CatalogQueryOptions, ICatalogRepository } from './CatalogRepository';
import { findCategoryById, findCategoryBySlug, findCategoryParent } from './categoryTree';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';
import { MockCatalogRepository } from './MockCatalogRepository';

/** CATALOG-01 — GET /v1/categories, CATALOG-02 — GET /v1/categories/{categoryId}/form */
export class HttpCatalogRepository implements ICatalogRepository {
  private readonly http: HttpClient;
  private readonly fallback: MockCatalogRepository;
  private facets: CatalogFacets | null = null;
  private tree: CategoryTreeNode[] | null = null;
  private formCache = new Map<string, CategoryFormDefinitionResponse>();

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
    this.fallback = new MockCatalogRepository();
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
    this.fallback.invalidate();
  }

  async getCategoryTree(options?: CatalogQueryOptions): Promise<CategoryTreeNode[]> {
    if (this.tree && !options?.fresh) {
      return this.tree;
    }
    try {
      const res = await this.http.request<CategoryTreeResponse>('/v1/categories', {
        method: 'GET',
      });
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        this.tree = res.items.filter(
          (node) =>
            node.slug !== 'ortak-alanlar' &&
            node.id !== 'c1000000-0000-4000-8000-000000000000' &&
            !node.name?.toLowerCase().includes('ortak alan')
        );
        return this.tree;
      }
    } catch {
      // Fallback to local JSON catalog
    }

    const fallbackTree = await this.fallback.getCategoryTree(options);
    this.tree = fallbackTree.filter(
      (node) =>
        node.slug !== 'ortak-alanlar' &&
        node.id !== 'c1000000-0000-4000-8000-000000000000' &&
        !node.name?.toLowerCase().includes('ortak alan')
    );
    return this.tree;
  }

  async getCategoryFormDefinition(
    categoryId: string,
    options?: CatalogQueryOptions & { categorySlug?: string }
  ): Promise<CategoryFormDefinitionResponse | null> {
    if (!categoryId && !options?.categorySlug) return null;

    const targetId = categoryId || options?.categorySlug || '';
    const targetSlug = options?.categorySlug || categoryId || '';

    if (options?.fresh) {
      this.formCache.delete(targetId);
      this.formCache.delete(targetSlug);
    } else if (this.formCache.has(targetId)) {
      return this.formCache.get(targetId) ?? null;
    } else if (this.formCache.has(targetSlug)) {
      return this.formCache.get(targetSlug) ?? null;
    }

    const tree = await this.getCategoryTree(options);

    let targetNode: CategoryTreeNode | null = null;
    let resolvedUUID: string | null = null;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      resolvedUUID = targetId;
      targetNode = findCategoryById(tree, targetId);
    } else {
      targetNode =
        findCategoryBySlug(tree, targetSlug) ||
        findCategoryBySlug(tree, targetId) ||
        findCategoryById(tree, targetId) ||
        findCategoryBySlug(tree, targetId.replace(/^cat-/, ''));
      resolvedUUID = targetNode?.id ?? null;
    }

    let responseSlug = targetNode?.slug || targetSlug;
    let responseName = targetNode?.name || '';
    let responseCategoryId = resolvedUUID || targetId;

    const isGlobalCategory =
      targetId === 'ortak-alanlar' ||
      targetSlug === 'ortak-alanlar' ||
      targetId === 'c1000000-0000-4000-8000-000000000000' ||
      targetId === 'cat-ortak-alanlar';

    if (isGlobalCategory && !resolvedUUID) {
      try {
        const rawRes = await this.http.request<CategoryTreeResponse>('/v1/categories', {
          method: 'GET',
        });
        if (rawRes && Array.isArray(rawRes.items)) {
          const globalNode = rawRes.items.find(
            (c) =>
              c.slug === 'ortak-alanlar' ||
              c.id === 'c1000000-0000-4000-8000-000000000000' ||
              c.name?.toLowerCase().includes('ortak alan')
          );
          if (globalNode) {
            resolvedUUID = globalNode.id;
            responseSlug = globalNode.slug;
            responseName = globalNode.name;
            responseCategoryId = globalNode.id;
          }
        }
      } catch {}
    }

    let parentDef: CategoryFormDefinitionResponse | null = null;
    const parentNode = targetNode
      ? findCategoryParent(tree, targetNode.id) || findCategoryParent(tree, targetNode.slug)
      : (resolvedUUID ? findCategoryParent(tree, resolvedUUID) : null);

    if (parentNode && parentNode.id !== resolvedUUID && parentNode.id !== targetId) {
      try {
        parentDef = await this.getCategoryFormDefinition(parentNode.id, options);
      } catch {
        // Parent properties optional
      }
    }

    let directProps: CategoryPropertyPublic[] = [];

    if (resolvedUUID) {
      try {
        const res = await this.http.request<CategoryFormDefinitionResponse>(
          `/v1/categories/${resolvedUUID}/form`,
          { method: 'GET' }
        );

        if (res && Array.isArray(res.properties)) {
          directProps = res.properties;
          if (res.slug) responseSlug = res.slug;
          if (res.name) responseName = res.name;
          if (res.categoryId) responseCategoryId = res.categoryId;
        }
      } catch {
        // Fallback
      }
    }

    if (directProps.length === 0) {
      const fallbackDef = await this.fallback.getCategoryFormDefinition(categoryId, options);
      if (fallbackDef && Array.isArray(fallbackDef.properties)) {
        directProps = fallbackDef.properties;
        if (!responseName && fallbackDef.name) responseName = fallbackDef.name;
        if (!responseSlug && fallbackDef.slug) responseSlug = fallbackDef.slug;
      }
    }

    if (directProps.length === 0 && (!parentDef || !parentDef.properties || parentDef.properties.length === 0)) {
      return null;
    }

    const merged = new Map<string, CategoryPropertyPublic>();

    if (parentDef && Array.isArray(parentDef.properties)) {
      for (const p of parentDef.properties) {
        merged.set(p.code, p);
      }
    }

    for (const p of directProps) {
      merged.set(p.code, p);
    }

    const mergedProperties = Array.from(merged.values()).sort(
      (a, b) => (a.sortOrder || 1) - (b.sortOrder || 1) || a.title.localeCompare(b.title, 'tr')
    );

    const response: CategoryFormDefinitionResponse = {
      categoryId: responseCategoryId,
      slug: responseSlug,
      name: responseName,
      properties: mergedProperties,
    };

    this.formCache.set(targetId, response);
    if (targetSlug && targetSlug !== targetId) {
      this.formCache.set(targetSlug, response);
    }
    if (resolvedUUID && resolvedUUID !== targetId) {
      this.formCache.set(resolvedUUID, response);
    }

    return response;
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
