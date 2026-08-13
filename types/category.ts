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
