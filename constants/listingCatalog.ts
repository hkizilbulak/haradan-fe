/** Product listing groups (çeşit) and leaf types (tür). Matches BE seed 00018. */

export const LISTING_GROUP_SLUGS = [
  'satilik-atlar',
  'at-hizmetleri',
  'asim-hizmetleri',
] as const;

export type ListingGroupSlug = (typeof LISTING_GROUP_SLUGS)[number];

export const HORSE_LISTING_GROUP_SLUGS = new Set<string>([
  'satilik-atlar',
  'asim-hizmetleri',
]);

export const HORSE_LISTING_LEAF_SLUGS = new Set<string>([
  'satilik-yaris-ati',
  'satilik-kisrak',
  'satilik-aygir',
  'satilik-binek-ati',
  'satilik-pony',
  'arap-aygir',
  'ingiliz-aygir',
]);

export const CATEGORY_NAMES_BY_ID_OR_SLUG: Record<string, string> = {
  'c1000000-0000-4000-8000-000000000000': 'Genel İlanlar',
  'ortak-alanlar': 'Genel İlanlar',
  'c1000000-0000-4000-8000-000000000001': 'Satılık Atlar',
  'satilik-atlar': 'Satılık Atlar',
  'c1000000-0000-4000-8000-000000000011': 'Satılık Yarış Atı',
  'satilik-yaris-ati': 'Satılık Yarış Atı',
  'cat-satilik-yaris-ati': 'Satılık Yarış Atı',
  'c-satilik-yaris': 'Satılık Yarış Atı',
  'c1000000-0000-4000-8000-000000000012': 'Satılık Kısrak',
  'satilik-kisrak': 'Satılık Kısrak',
  'c-satilik-kisrak': 'Satılık Kısrak',
  'c1000000-0000-4000-8000-000000000013': 'Satılık Aygır',
  'satilik-aygir': 'Satılık Aygır',
  'c-satilik-aygir': 'Satılık Aygır',
  'c1000000-0000-4000-8000-000000000014': 'Satılık Binek Atı',
  'satilik-binek-ati': 'Satılık Binek Atı',
  'c-satilik-binek': 'Satılık Binek Atı',
  'c1000000-0000-4000-8000-000000000015': 'Satılık Pony',
  'satilik-pony': 'Satılık Pony',
  'c-satilik-pony': 'Satılık Pony',
  'c1000000-0000-4000-8000-000000000002': 'At Hizmetleri',
  'at-hizmetleri': 'At Hizmetleri',
  'c1000000-0000-4000-8000-000000000021': 'Pansiyon Haralar',
  'pansiyon-haralar': 'Pansiyon Haralar',
  'c1000000-0000-4000-8000-000000000022': 'At Nakliyesi',
  'at-nakliyesi': 'At Nakliyesi',
  'c1000000-0000-4000-8000-000000000023': 'Nalbantlar',
  'nalbantlar': 'Nalbantlar',
  'c1000000-0000-4000-8000-000000000003': 'Aşım Hizmetleri',
  'asim-hizmetleri': 'Aşım Hizmetleri',
  'c1000000-0000-4000-8000-000000000031': 'Arap Aygır',
  'arap-aygir': 'Arap Aygır',
  'cat-arap-aygir': 'Arap Aygır',
  'c1000000-0000-4000-8000-000000000032': 'İngiliz Aygır',
  'ingiliz-aygir': 'İngiliz Aygır',
  'cat-ingiliz-aygir': 'İngiliz Aygır',
  'c1000000-0000-4000-8000-000000000004': 'Ekipman & Malzemeler',
  'ekipman-malzemeler': 'Ekipman & Malzemeler',
  'c1000000-0000-4000-8000-000000000005': 'Ahır & Çiftlik',
  'ahir-tesis': 'Ahır & Çiftlik',
};

