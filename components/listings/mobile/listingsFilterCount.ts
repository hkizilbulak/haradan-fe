import type { ListingsFiltersState } from '@/components/listings/ListingsFilterSidebar';

/** Aktif filtre sayısı — mobil badge için. */
export function countActiveListingsFilters(f: ListingsFiltersState): number {
  let n = 0;
  if (f.categorySlug) n += 1;
  if (f.breed) n += 1;
  if (f.urgentOnly) n += 1;
  if (f.provinceIds?.length) n += 1;
  if (f.districtId) n += 1;
  if (f.priceMinTl != null) n += 1;
  if (f.priceMaxTl != null) n += 1;
  if (f.period) n += 1;
  if (f.breeds?.length) n += 1;
  if (f.ages?.length) n += 1;
  if (f.colors?.length) n += 1;
  if (f.genders?.length) n += 1;
  if (f.features?.length) n += 1;
  const facKeys = Object.keys(f.facilities ?? {}).filter(
    (k) => Boolean(f.facilities[k as keyof typeof f.facilities])
  );
  if (facKeys.length) n += 1;
  return n;
}

export function emptyListingsFilters(): ListingsFiltersState {
  return {
    categorySlug: null,
    breed: null,
    urgentOnly: false,
    provinceIds: [],
    districtId: null,
    priceMinTl: null,
    priceMaxTl: null,
    period: null,
    facilities: {},
    breeds: [],
    ages: [],
    colors: [],
    genders: [],
    features: [],
  };
}
