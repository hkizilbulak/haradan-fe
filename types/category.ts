/** OpenAPI: CategoryTreeNode */
export type CategoryTreeNode = {
  id: string;
  slug: string;
  name: string;
  children: CategoryTreeNode[];
};

/** OpenAPI: CategoryTreeResponse */
export type CategoryTreeResponse = {
  items: CategoryTreeNode[];
};

/** Filtre grubu türü — BE facet endpoint’i ile aynı sözleşme. */
export type CatalogFacetKind = 'category' | 'breed' | 'status';

export type CatalogFacetOption = {
  id: string;
  slug: string;
  label: string;
  /** Varsayılan açık; UI kapalı başlar, seçiliyse seed edilir. */
  defaultExpanded?: boolean;
  children: CatalogFacetOption[];
};

export type CatalogFacetGroup = {
  id: string;
  label: string;
  kind: CatalogFacetKind;
  /** Grup başlığı açık mı — listings UI kapalı başlar. */
  defaultExpanded: boolean;
  options: CatalogFacetOption[];
};

/** İlanlar sol menü — GET /v1/catalog/facets */
export type CatalogFacets = {
  groups: CatalogFacetGroup[];
};

export type PropertyDataType =
  | 'STRING'
  | 'TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'SINGLE_SELECT'
  | 'YEAR';

export type CategoryPropertyOption = {
  value: string;
  label: string;
};

export type CategoryPropertyPublic = {
  id?: string;
  code: string;
  title: string;
  helpText?: string | null;
  dataType: PropertyDataType;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
  options: CategoryPropertyOption[];
  defaultValue?: unknown;
  uiMetadata?: Record<string, unknown>;
};

export type CategoryFormDefinitionResponse = {
  categoryId: string;
  slug: string;
  name: string;
  properties: CategoryPropertyPublic[];
};

