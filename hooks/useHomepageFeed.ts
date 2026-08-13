import { useEffect, useMemo } from 'react';
import { useHomepage } from '@/hooks/useHomepage';
import { useFavorites } from '@/hooks/useFavorites';

/**
 * Ana sayfa view-model: tek cache, ortak favori store.
 */
export function useHomepageFeed() {
  const home = useHomepage();
  const { apply, remember, items, count, toggle, remove } = useFavorites();

  const urgent = useMemo(() => {
    if (!home.data) return [];
    const source =
      home.data.urgentAdverts.length > 0
        ? home.data.urgentAdverts
        : home.data.newAdverts;
    return apply(source);
  }, [home.data, apply]);

  const trending = useMemo(
    () => (home.data ? apply(home.data.trending) : []),
    [home.data, apply]
  );

  const specialOffers = useMemo(
    () => (home.data ? apply(home.data.specialOffers) : []),
    [home.data, apply]
  );

  useEffect(() => {
    remember([...urgent, ...trending, ...specialOffers]);
  }, [remember, urgent, trending, specialOffers]);

  return {
    ...home,
    urgent,
    trending,
    specialOffers,
    favoriteItems: items,
    favoriteCount: count,
    toggleFavorite: toggle,
    removeFavorite: remove,
  };
}
