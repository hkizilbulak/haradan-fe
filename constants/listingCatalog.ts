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
