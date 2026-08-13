import type { CatalogProductCard } from '@/types';

export function applyFavoriteOverrides<T extends CatalogProductCard>(
  items: T[],
  overrides: Record<string, boolean>
): T[] {
  if (Object.keys(overrides).length === 0) return items;
  return items.map((item) =>
    overrides[item.id] === undefined
      ? item
      : { ...item, isFavorite: overrides[item.id] }
  );
}
