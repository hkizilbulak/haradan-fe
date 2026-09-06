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
import CATALOG_DATA from '../../data/catalog.json';

/**
 * Kategori ağacı ve facet verisinin ne kadar süre cache'de tutulacağı (ms).
 * Bu süre dolduğunda bir sonraki istek BE'den taze veri çeker; böylece
 * BO'dan yapılan pasife/aktife alma işlemleri FE'ye otomatik yansır.
 */
const CATALOG_TREE_TTL_MS = 5 * 60 * 1000; // 5 dakika

const GLOBAL_CATEGORY_ID = 'c1000000-0000-4000-8000-000000000000';

function isHiddenGlobalCategory(node: CategoryTreeNode): boolean {
  return (
    node.slug === 'ortak-alanlar' ||
    node.slug === 'cat-ortak-alanlar' ||
    node.id === GLOBAL_CATEGORY_ID ||
    Boolean(node.name?.toLowerCase().includes('ortak alan')) ||
    Boolean(node.slug?.toLowerCase().includes('ortak'))
  );
}

function filterDisplayTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return (nodes || []).filter((node) => !isHiddenGlobalCategory(node));
}

function findGlobalCategory(nodes: CategoryTreeNode[]): CategoryTreeNode | undefined {
  return (nodes || []).find((c) => isHiddenGlobalCategory(c));
}

/** CATALOG-01 — GET /v1/categories, CATALOG-02 — GET /v1/categories/{categoryId}/form */
export class HttpCatalogRepository implements ICatalogRepository {
  private readonly http: HttpClient;
  private readonly fallback: MockCatalogRepository;
  private facets: CatalogFacets | null = null;
  private facetsFetchedAt: number = 0;
  /** Listing/nav için ortak-alanlar çıkarılarak saklanır. */
  private tree: CategoryTreeNode[] | null = null;
  /** Form UUID çözümlemesi için filtresiz ağaç (tek GET /v1/categories). */
  private rawTree: CategoryTreeNode[] | null = null;
  private treeFetchedAt: number = 0;
  private treeInflight: Promise<CategoryTreeNode[]> | null = null;
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
    this.facetsFetchedAt = 0;
    this.tree = null;
    this.rawTree = null;
    this.treeFetchedAt = 0;
    this.treeInflight = null;
    this.formCache.clear();
    this.fallback.invalidate();
  }

  async getCategoryTree(options?: CatalogQueryOptions): Promise<CategoryTreeNode[]> {
    const now = Date.now();
    const treeExpired = this.treeFetchedAt > 0 && now - this.treeFetchedAt > CATALOG_TREE_TTL_MS;

    if (options?.fresh || treeExpired) {
      this.tree = null;
      this.rawTree = null;
      this.treeFetchedAt = 0;
      this.treeInflight = null;
    }

    if (this.tree && !options?.fresh) {
      return this.tree;
    }
    if (this.treeInflight) {
      return this.treeInflight;
    }

    this.treeInflight = this.fetchAndCacheTree(options).finally(() => {
      this.treeInflight = null;
    });
    return this.treeInflight;
  }

  private async fetchAndCacheTree(options?: CatalogQueryOptions): Promise<CategoryTreeNode[]> {
    try {
      const res = await this.http.request<CategoryTreeResponse>('/v1/categories', {
        method: 'GET',
      });
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        this.rawTree = res.items;
        this.tree = filterDisplayTree(res.items);
        this.treeFetchedAt = Date.now();
        return this.tree;
      }
    } catch {
      // Fallback to local JSON catalog
    }

    const fallbackTree = await this.fallback.getCategoryTree(options);
    this.rawTree = fallbackTree;
    this.tree = filterDisplayTree(fallbackTree);
    // Fallback verisi için daha kısa TTL — 1 dakika
    this.treeFetchedAt = Date.now() - (CATALOG_TREE_TTL_MS - 60_000);
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

    // Form refresh must not force a second/third GET /v1/categories — reuse tree
    // cache (inflight-deduped). fresh only invalidates the form cache above.
    await this.getCategoryTree();
    const lookupTree = this.rawTree ?? this.tree ?? [];

    let targetNode: CategoryTreeNode | null = null;
    let resolvedUUID: string | null = null;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      resolvedUUID = targetId;
      targetNode = findCategoryById(lookupTree, targetId);
    } else {
      targetNode =
        findCategoryBySlug(lookupTree, targetSlug) ||
        findCategoryBySlug(lookupTree, targetId) ||
        findCategoryById(lookupTree, targetId) ||
        findCategoryBySlug(lookupTree, targetId.replace(/^cat-/, ''));
      resolvedUUID = targetNode?.id ?? null;
    }

    let responseSlug = targetNode?.slug || targetSlug;
    let responseName = targetNode?.name || '';
    let responseCategoryId = resolvedUUID || targetId;
    let responseAllowTjk = typeof targetNode?.allowTjk === 'boolean' ? targetNode.allowTjk : false;

    const isGlobalCategory =
      targetId === 'ortak-alanlar' ||
      targetSlug === 'ortak-alanlar' ||
      targetId === GLOBAL_CATEGORY_ID ||
      targetId === 'cat-ortak-alanlar';

    if (isGlobalCategory && !resolvedUUID) {
      const globalNode = findGlobalCategory(lookupTree);
      if (globalNode) {
        resolvedUUID = globalNode.id;
        responseSlug = globalNode.slug;
        responseName = globalNode.name;
        responseCategoryId = globalNode.id;
        if (typeof globalNode.allowTjk === 'boolean') {
          responseAllowTjk = globalNode.allowTjk;
        }
      } else {
        // Stable seeded id — avoids an extra /v1/categories round-trip.
        resolvedUUID = GLOBAL_CATEGORY_ID;
        responseCategoryId = GLOBAL_CATEGORY_ID;
        responseSlug = 'ortak-alanlar';
      }
    }

    let directProps: CategoryPropertyPublic[] = [];
    let apiSucceeded = false;

    if (resolvedUUID) {
      try {
        const res = await this.http.request<CategoryFormDefinitionResponse>(
          `/v1/categories/${resolvedUUID}/form`,
          { method: 'GET' }
        );

        if (res && Array.isArray(res.properties)) {
          directProps = res.properties;
          apiSucceeded = true;
          if (res.slug) responseSlug = res.slug;
          if (res.name) responseName = res.name;
          if (res.categoryId) responseCategoryId = res.categoryId;
          if (typeof res.allowTjk === 'boolean') responseAllowTjk = res.allowTjk;
        }
      } catch {
        // Fallback
      }
    }

    if (!apiSucceeded) {
      const fallbackDef = await this.fallback.getCategoryFormDefinition(categoryId, options);
      if (fallbackDef && Array.isArray(fallbackDef.properties)) {
        directProps = fallbackDef.properties;
        if (!responseName && fallbackDef.name) responseName = fallbackDef.name;
        if (!responseSlug && fallbackDef.slug) responseSlug = fallbackDef.slug;
        if (typeof fallbackDef.allowTjk === 'boolean') responseAllowTjk = fallbackDef.allowTjk;
      }
    }

    if (directProps.length === 0 && !apiSucceeded) {
      return null;
    }

    const initialProps = (CATALOG_DATA.categoryProperties || []) as any[];
    for (const ip of initialProps) {
      const found = directProps.find((p) => p.code === ip.code);
      if (found && ip.options && ip.options.length > 0) {
        found.options = ip.options;
      }
    }

    const sortedProperties = [...directProps].sort(
      (a, b) => (a.sortOrder || 1) - (b.sortOrder || 1) || a.title.localeCompare(b.title, 'tr')
    );

    const response: CategoryFormDefinitionResponse = {
      categoryId: responseCategoryId,
      slug: responseSlug,
      name: responseName,
      allowTjk: responseAllowTjk,
      properties: sortedProperties,
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
    const now = Date.now();
    const facetsExpired = this.facetsFetchedAt > 0 && now - this.facetsFetchedAt > CATALOG_TREE_TTL_MS;

    if (this.facets && !options?.fresh && !facetsExpired) {
      return this.facets;
    }

    const tree = await this.getCategoryTree(options);
    this.facets = mapCategoryTreeToFacets(tree);
    this.facetsFetchedAt = Date.now();
    return this.facets;
  }
}
