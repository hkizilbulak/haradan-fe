import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useHomepage } from '@/hooks/useHomepage';
import { useFavorites } from '@/hooks/useFavorites';

/**
 * Ana sayfa view-model: tek cache, ortak favori store.
 * Sadece tab/screen odaktayken network — listings’e gidince bootstrap yenilenmez.
 */
export function useHomepageFeed() {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const home = useHomepage(undefined, { enabled: focused });
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
