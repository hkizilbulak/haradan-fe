import { Ionicons } from '@expo/vector-icons';
import { LISTING_GROUP_SLUGS } from '@/constants/listingCatalog';
import type { CategoryTreeNode } from '@/types';

/** Ana kategori (grup) ikonları — BE slug ile eşleşir. */
const ROOT_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'satilik-atlar': 'trophy-outline',
  'at-hizmetleri': 'briefcase-outline',
  'asim-hizmetleri': 'heart-outline',
  'ekipman-malzemeler': 'construct-outline',
  'ahir-tesisler': 'home-outline',
};

/** Alt kategori (tür) ikonları — ilan ver adımı ile aynı sözlük. */
const LEAF_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'satilik-yaris-ati': 'flag-outline',
  'satilik-kisrak': 'female-outline',
  'satilik-aygir': 'male-outline',
  'satilik-binek-ati': 'walk-outline',
  'satilik-pony': 'paw-outline',
  'pansiyon-haralar': 'home-outline',
  'at-nakliyesi': 'car-outline',
  nalbantlar: 'hammer-outline',
  'arap-aygir': 'flower-outline',
  'ingiliz-aygir': 'ribbon-outline',
};

function slugHeuristicIcon(slug: string): keyof typeof Ionicons.glyphMap {
  const s = slug.toLowerCase();
  if (s.includes('asim') || s.includes('aşım') || s.includes('aygir') || s.includes('aygır')) {
    return 'heart-outline';
  }
  if (
    s.includes('hizmet') ||
    s.includes('nakliye') ||
    s.includes('pansiyon') ||
    s.includes('nalbant')
  ) {
    return 'briefcase-outline';
  }
  if (
    s.startsWith('satilik-') ||
    s.includes('yaris') ||
    s.includes('binek-ati') ||
    s.includes('kisrak')
  ) {
    return 'trophy-outline';
  }
  if (s.includes('ekipman') || s.includes('malzeme')) {
    return 'construct-outline';
  }
  return 'grid-outline';
}

/**
 * Kategori slug → Ionicons adı.
 * Bilinmeyen slug’lar için heuristik; yeni BE kategorileri ikon alır.
 */
export function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return (
    ROOT_CATEGORY_ICONS[slug] ??
    LEAF_CATEGORY_ICONS[slug] ??
    slugHeuristicIcon(slug)
  );
}

/**
 * İlan ver / mobil kısayol / menü — ana kategori grupları.
 * LISTING_GROUP_SLUGS sırası korunur; BE’ye yeni kök eklenirse sona eklenir.
 */
export function pickListingRootCategories(
  tree: CategoryTreeNode[]
): CategoryTreeNode[] {
  if (tree.length === 0) return [];

  const bySlug = new Map(tree.map((node) => [node.slug, node]));
  const ordered = LISTING_GROUP_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (node): node is CategoryTreeNode => node != null
  );

  const seen = new Set(ordered.map((n) => n.slug));
  const extras = tree.filter((node) => !seen.has(node.slug));

  if (ordered.length > 0) return [...ordered, ...extras];
  return tree;
}
