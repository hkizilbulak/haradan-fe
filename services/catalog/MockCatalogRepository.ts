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
  private categories: RawCategory[];
  private properties: RawProperty[];
  private cachedTree: CategoryTreeNode[] | null = null;
  private cachedFacets: CatalogFacets | null = null;

  constructor() {
    this.categories = (CATALOG_DATA.categories || []) as RawCategory[];
    this.properties = (CATALOG_DATA.categoryProperties || []) as RawProperty[];
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
    if (this.cachedTree && !options?.fresh) {
      return this.cachedTree;
    }

    const activeCategories = this.categories.filter((c) => c.isActive);
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
    const targetKey = categoryId || options?.categorySlug;
    if (!targetKey) return null;

    const cat = this.resolveCategory(targetKey);
    if (!cat) return null;

    // Get direct properties
    let props = this.properties.filter(
      (p) =>
        p.isActive &&
        (p.categoryId === cat.id || p.categoryId === cat.slug)
    );

    // If no direct properties, inherit from parent
    if (props.length === 0 && cat.parentId) {
      const parent = this.resolveCategory(cat.parentId);
      if (parent) {
        props = this.properties.filter(
          (p) =>
            p.isActive &&
            (p.categoryId === parent.id || p.categoryId === parent.slug)
        );
      }
    }

    const mappedProperties: CategoryPropertyPublic[] = props
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'tr'))
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
