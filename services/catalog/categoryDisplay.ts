import { Ionicons } from '@expo/vector-icons';
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
  const s = (slug || '').toLowerCase();
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
    s.includes('kisrak') ||
    s.includes('at')
  ) {
    return 'trophy-outline';
  }
  if (s.includes('ekipman') || s.includes('malzeme')) {
    return 'construct-outline';
  }
  if (s.includes('ahir') || s.includes('ahır') || s.includes('tesis')) {
    return 'home-outline';
  }
  return 'grid-outline';
}

/**
 * Kategori slug → Ionicons adı.
 * Bilinmeyen slug’lar için heuristik; yeni BE / BO kategorileri dinamik ikon alır.
 */
export function getCategoryIcon(slug?: string | null): keyof typeof Ionicons.glyphMap {
  if (!slug) return 'grid-outline';
  return (
    ROOT_CATEGORY_ICONS[slug] ??
    LEAF_CATEGORY_ICONS[slug] ??
    slugHeuristicIcon(slug)
  );
}

/**
 * İlan ver / mobil kısayol / menü — ana kategori grupları.
 * Back Office ve Backend'den gelen dinamik kategori ağacı ve sıralaması korunur.
 */
export function pickListingRootCategories(
  tree: CategoryTreeNode[]
): CategoryTreeNode[] {
  if (!tree || tree.length === 0) return [];
  return tree.filter(
    (n) =>
      n.slug !== 'ortak-alanlar' &&
      n.slug !== 'cat-ortak-alanlar' &&
      n.id !== 'c1000000-0000-4000-8000-000000000000'
  );
}

/** Mobil chip — uzun kategori adlarını kısa premium etiketlere çevirir. */
const ROOT_SHORT_LABELS: Record<string, string> = {
  'satilik-atlar': 'Satılık',
  'at-hizmetleri': 'Hizmet',
  'asim-hizmetleri': 'Aşım',
  'ekipman-malzemeler': 'Ekipman',
  'ahir-tesisler': 'Tesis',
};

export function getCategoryShortLabel(
  slug?: string | null,
  fallbackName?: string | null
): string {
  if (slug && ROOT_SHORT_LABELS[slug]) return ROOT_SHORT_LABELS[slug];
  const name = (fallbackName ?? '').trim();
  if (!name) return 'Kategori';
  if (name.length <= 10) return name;
  // "Satılık Atlar" → ilk kelime; aksi halde 9 + …
  const first = name.split(/\s+/)[0] ?? name;
  if (first.length <= 10) return first;
  return `${name.slice(0, 9)}…`;
}

