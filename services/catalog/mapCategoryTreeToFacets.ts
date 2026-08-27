import type {
  CatalogFacetGroup,
  CatalogFacetOption,
  CatalogFacets,
  CategoryTreeNode,
} from '@/types';

const BREED_OPTIONS: CatalogFacetOption[] = [
  { id: 'breed-thoroughbred', slug: 'İngiliz (Thoroughbred)', label: 'İngiliz (Thoroughbred)', children: [] },
  { id: 'breed-arabian', slug: 'Safkan Arap', label: 'Safkan Arap', children: [] },
  { id: 'breed-warmblood', slug: 'Warmblood / Spor Atı', label: 'Warmblood / Spor Atı', children: [] },
  { id: 'breed-haflinger', slug: 'Haflinger', label: 'Haflinger', children: [] },
  { id: 'breed-pony', slug: 'Pony / Midilli', label: 'Pony / Midilli', children: [] },
  { id: 'breed-rahvan', slug: 'Rahvan', label: 'Rahvan', children: [] },
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
  const visibleNodes = tree.filter(
    (n) =>
      n.slug !== 'ortak-alanlar' &&
      n.slug !== 'cat-ortak-alanlar' &&
      n.id !== 'c1000000-0000-4000-8000-000000000000'
  );

  const categoryGroup: CatalogFacetGroup = {
    id: 'listing-type',
    label: 'İlan türü',
    kind: 'category',
    defaultExpanded: false,
    options: visibleNodes.map(toOption),
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
