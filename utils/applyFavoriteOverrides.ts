import type { CatalogProductCard } from '@/types';
import { advertKey } from '@/types/advertId';

export function applyFavoriteOverrides<T extends CatalogProductCard>(
  items: T[],
  overrides: Record<string, boolean>
): T[] {
  if (Object.keys(overrides).length === 0) return items;
  return items.map((item) => {
    const key = advertKey(item.id);
    return overrides[key] === undefined
      ? item
      : { ...item, isFavorite: overrides[key] };
  });
}
