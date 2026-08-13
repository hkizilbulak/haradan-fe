import type {
  CatalogFacetGroup,
  CatalogFacetOption,
  CatalogFacets,
  CategoryTreeNode,
} from '@/types';

const BREED_OPTIONS: CatalogFacetOption[] = [
  { id: 'breed-thoroughbred', slug: 'Thoroughbred', label: 'Thoroughbred', children: [] },
  { id: 'breed-arabian', slug: 'Arabian', label: 'Arabian', children: [] },
  { id: 'breed-warmblood', slug: 'Warmblood', label: 'Warmblood', children: [] },
  { id: 'breed-haflinger', slug: 'Haflinger', label: 'Haflinger', children: [] },
  { id: 'breed-pony', slug: 'Pony', label: 'Pony', children: [] },
  { id: 'breed-shetland', slug: 'Shetland', label: 'Shetland', children: [] },
];

function toOption(node: CategoryTreeNode): CatalogFacetOption {
  return {
    id: node.id,
    slug: node.slug,
    label: node.name,
    defaultExpanded: false,
    children: node.children.map(toOption),
  };
}

/**
 * Kategori ağacı + statik at türleri → facet grupları.
 * Http mapper BE DTO’sunu aynı CatalogFacets şekline çevirir.
 */
export function mapCategoryTreeToFacets(
  tree: CategoryTreeNode[]
): CatalogFacets {
  const categoryGroup: CatalogFacetGroup = {
    id: 'listing-type',
    label: 'İlan türü',
    kind: 'category',
    defaultExpanded: false,
    options: tree.map(toOption),
  };

  const breedGroup: CatalogFacetGroup = {
    id: 'horse-breed',
    label: 'At türü',
    kind: 'breed',
    defaultExpanded: false,
    options: BREED_OPTIONS,
  };

  const statusGroup: CatalogFacetGroup = {
    id: 'listing-status',
    label: 'Durum',
    kind: 'status',
    defaultExpanded: false,
    options: [
      {
        id: 'status-urgent',
        slug: 'urgent',
        label: 'Acil',
        children: [],
      },
    ],
  };

  return { groups: [categoryGroup, breedGroup, statusGroup] };
}
