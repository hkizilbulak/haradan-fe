import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryPropertyPublic,
  CategoryTreeNode,
} from '@/types';
import type { CatalogQueryOptions, ICatalogRepository } from './CatalogRepository';
import { mapCategoryTreeToFacets } from './mapCategoryTreeToFacets';
import CATALOG_DATA from '@/data/catalog.json';

type RawCategory = {
  id: string;
  parentId?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  version: number;
};

type RawProperty = {
  id: string;
  categoryId: string;
  code: string;
  title: string;
  helpText?: string | null;
  dataType: string;
  isRequired: boolean;
  isPublicVisible: boolean;
  isFormVisible: boolean;
  isFilterable: boolean;
  sortOrder: number;
  isActive: boolean;
  version: number;
  options: Array<{ value: string; label: string }>;
  validation?: Record<string, unknown>;
  defaultValue?: unknown;
  uiMetadata?: Record<string, unknown>;
};

export class MockCatalogRepository implements ICatalogRepository {
  private categories: RawCategory[] = [];
  private properties: RawProperty[] = [];
  private cachedTree: CategoryTreeNode[] | null = null;
  private cachedFacets: CatalogFacets | null = null;

  constructor() {
    this.refreshData();

    if (typeof window !== 'undefined') {
      try {
        const bc = new BroadcastChannel('haradan_catalog_channel');
        bc.onmessage = (event) => {
          if (event.data?.data) {
            const d = event.data.data;
            if (Array.isArray(d.categories) && Array.isArray(d.categoryProperties)) {
              this.categories = d.categories;
              this.properties = d.categoryProperties;
              this.invalidate();
              window.dispatchEvent(new Event('haradan_category_properties_changed'));
              return;
            }
          }
          this.invalidate();
          this.refreshData();
          window.dispatchEvent(new Event('haradan_category_properties_changed'));
        };
      } catch {}

      window.addEventListener('storage', () => {
        this.invalidate();
        this.refreshData();
        window.dispatchEvent(new Event('haradan_category_properties_changed'));
      });

      window.addEventListener('haradan_catalog_data_changed', () => {
        this.invalidate();
        this.refreshData();
        window.dispatchEvent(new Event('haradan_category_properties_changed'));
      });
    }
  }

  private refreshData(): void {
    const initialCats = (CATALOG_DATA.categories || []) as RawCategory[];
    const initialProps = (CATALOG_DATA.categoryProperties || []) as RawProperty[];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('haradan_catalog_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            Array.isArray(parsed.categories) &&
            Array.isArray(parsed.categoryProperties)
          ) {
            const globalCat = initialCats.find(c => c.id === 'c1000000-0000-4000-8000-000000000000');
            if (globalCat && !parsed.categories.some((c: any) => c.id === globalCat.id)) {
              parsed.categories.unshift(globalCat);
            }
            const globalProps = initialProps.filter(p => p.categoryId === 'c1000000-0000-4000-8000-000000000000');
            for (const gp of globalProps) {
              if (!parsed.categoryProperties.some((p: any) => p.code === gp.code && (p.categoryId === gp.categoryId || p.id === gp.id))) {
                parsed.categoryProperties.unshift(gp);
              }
            }
            const ORPHAN_CODES = new Set(['liveFoalGuarantee', 'mobileService', 'insurance']);
            const ORPHAN_IDS = new Set([
              'p1000000-0000-4000-8000-000000000044',
              'p1000000-0000-4000-8000-000000000036',
              'p1000000-0000-4000-8000-000000000033',
            ]);
            parsed.categoryProperties = parsed.categoryProperties.filter(
              (p: any) => !ORPHAN_CODES.has(p.code) && !ORPHAN_IDS.has(p.id)
            );
            this.categories = parsed.categories;
            this.properties = parsed.categoryProperties;
            return;
          }
        }
      } catch {}
    }
    this.categories = initialCats;
    this.properties = initialProps;
  }

  getCachedFacets(): CatalogFacets | null {
    return this.cachedFacets;
  }

  getCachedCategoryTree(): CategoryTreeNode[] | null {
    return this.cachedTree;
  }

  invalidate(): void {
    this.cachedTree = null;
    this.cachedFacets = null;
  }

  private resolveCategory(idOrSlug: string): RawCategory | undefined {
    if (!idOrSlug) return undefined;
    const clean = idOrSlug.replace(/^cat-/, '');
    return this.categories.find(
      (c) =>
        c.id === idOrSlug ||
        c.slug === idOrSlug ||
        c.slug === clean ||
        c.id === `cat-${clean}`
    );
  }

  async getCategoryTree(options?: CatalogQueryOptions): Promise<CategoryTreeNode[]> {
    this.refreshData();
    if (this.cachedTree && !options?.fresh) {
      return this.cachedTree;
    }

    const activeCategories = this.categories.filter(
      (c) =>
        c.isActive &&
        c.slug !== 'ortak-alanlar' &&
        c.id !== 'c1000000-0000-4000-8000-000000000000' &&
        !c.name?.toLowerCase().includes('ortak alan')
    );
    const nodeMap = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    activeCategories.forEach((cat) => {
      nodeMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        children: [],
      });
    });

    activeCategories.forEach((cat) => {
      const node = nodeMap.get(cat.id);
      if (!node) return;

      if (cat.parentId) {
        const parent = nodeMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
          return;
        }
      }
      roots.push(node);
    });

    const sortNodes = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => {
        const catA = this.categories.find((c) => c.id === a.id);
        const catB = this.categories.find((c) => c.id === b.id);
        const orderA = catA?.sortOrder ?? 0;
        const orderB = catB?.sortOrder ?? 0;
        return orderA - orderB || a.name.localeCompare(b.name, 'tr');
      });
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(roots);
    this.cachedTree = roots;
    return roots;
  }

  async getFacets(options?: CatalogQueryOptions): Promise<CatalogFacets> {
    this.refreshData();
    if (this.cachedFacets && !options?.fresh) {
      return this.cachedFacets;
    }
    const tree = await this.getCategoryTree(options);
    this.cachedFacets = mapCategoryTreeToFacets(tree);
    return this.cachedFacets;
  }

  async getCategoryFormDefinition(
    categoryId: string,
    options?: CatalogQueryOptions & { categorySlug?: string }
  ): Promise<CategoryFormDefinitionResponse | null> {
    this.refreshData();
    const targetKey = categoryId || options?.categorySlug;
    if (!targetKey) return null;

    const cat = this.resolveCategory(targetKey);
    if (!cat) return null;

    // Collect parent properties if exists
    let parentProps: RawProperty[] = [];
    if (cat.parentId) {
      const parentDef = await this.getCategoryFormDefinition(cat.parentId, { fresh: true });
      if (parentDef && Array.isArray(parentDef.properties)) {
        parentProps = parentDef.properties.map((p) => ({
          id: p.id || `prop-${p.code}`,
          categoryId: cat.parentId!,
          code: p.code,
          title: p.title,
          helpText: p.helpText || null,
          dataType: p.dataType,
          isRequired: Boolean(p.isRequired),
          isPublicVisible: true,
          isFormVisible: true,
          isFilterable: p.isFilterable !== false,
          sortOrder: p.sortOrder || 1,
          isActive: true,
          version: 1,
          options: (p.options || []) as any,
          defaultValue: p.defaultValue,
          uiMetadata: p.uiMetadata,
        }));
      }
    }

    // Direct properties for this category
    const directProps = this.properties.filter(
      (p) =>
        p.isActive &&
        (p.categoryId === cat.id || p.categoryId === cat.slug)
    );

    // Merge parent properties with direct properties (direct overrides parent with same code)
    const merged = new Map<string, RawProperty>();
    for (const p of parentProps) {
      merged.set(p.code, p);
    }
    for (const p of directProps) {
      merged.set(p.code, p);
    }

    const props = Array.from(merged.values());

    const mappedProperties: CategoryPropertyPublic[] = props
      .sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1) || a.title.localeCompare(b.title, 'tr'))
      .map((p) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        helpText: p.helpText || null,
        dataType: p.dataType as CategoryPropertyPublic['dataType'],
        isRequired: Boolean(p.isRequired),
        isFilterable: p.isFilterable !== false,
        sortOrder: p.sortOrder || 1,
        options: p.options || [],
        defaultValue: p.defaultValue,
        uiMetadata: p.uiMetadata,
      }));

    return {
      categoryId: cat.id,
      slug: cat.slug,
      name: cat.name,
      properties: mappedProperties,
    };
  }
}
