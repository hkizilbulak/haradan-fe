import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getFavoriteItems,
  getFavoriteOverrides,
  rememberFavoriteCards,
  removeFavorite,
  subscribeFavoriteOverrides,
  toggleFavorite,
} from '@/services/favorites';
import { applyFavoriteOverrides } from '@/utils/applyFavoriteOverrides';
import type { CatalogProductCard } from '@/types';

export function useFavorites() {
  const [tick, setTick] = useState(0);

  useEffect(
    () => subscribeFavoriteOverrides(() => setTick((n) => n + 1)),
    []
  );

  const overrides = useMemo(() => getFavoriteOverrides(), [tick]);
  const items = useMemo(() => getFavoriteItems(), [tick]);

  const apply = useCallback(
    <T extends CatalogProductCard>(list: T[]): T[] =>
      applyFavoriteOverrides(list, overrides),
    [overrides]
  );

  const remember = useCallback((list: CatalogProductCard[]) => {
    rememberFavoriteCards(list);
  }, []);

  const toggle = useCallback((card: CatalogProductCard) => {
    toggleFavorite(card);
  }, []);

  const remove = useCallback((id: string) => {
    removeFavorite(id);
  }, []);

  return {
    items,
    count: items.length,
    apply,
    remember,
    toggle,
    remove,
  };
}
