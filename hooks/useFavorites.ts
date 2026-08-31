import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getValidAccessToken } from '@/services/auth';
import {
  clearFavorites,
  favoritesRepository,
  getFavoriteItems,
  getFavoriteOverrides,
  rememberFavoriteCards,
  removeFavoriteLocal,
  replaceFavoritesFromServer,
  subscribeFavoriteOverrides,
  toggleFavoriteLocal,
} from '@/services/favorites';
import { applyFavoriteOverrides } from '@/utils/applyFavoriteOverrides';
import type { CatalogProductCard } from '@/types'
import type { AdvertId } from '@/types/advertId';

/**
 * Favoriler: login zorunlu, kaynak BE /v1/me/favorites.
 * Logout → yerel cache temizlenir; login → DB listesi hydrate edilir.
 */
export function useFavorites() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, session } = useAuthSession();
  const [tick, setTick] = useState(0);
  const [hydrating, setHydrating] = useState(false);
  const hydrateGen = useRef(0);

  useEffect(
    () => subscribeFavoriteOverrides(() => setTick((n) => n + 1)),
    []
  );

  useEffect(() => {
    if (!isLoggedIn) {
      clearFavorites();
      return;
    }
    const repo = favoritesRepository;
    if (!repo) return;

    const gen = ++hydrateGen.current;
    setHydrating(true);
    void (async () => {
      try {
        const token =
          (await getValidAccessToken()) ?? session?.accessToken ?? null;
        if (!token || gen !== hydrateGen.current) return;
        const result = await repo.list(token);
        if (gen !== hydrateGen.current) return;
        replaceFavoritesFromServer(result.items);
      } catch {
        if (gen === hydrateGen.current) {
          // Keep empty / previous optimistic state; next open can retry.
        }
      } finally {
        if (gen === hydrateGen.current) setHydrating(false);
      }
    })();
  }, [isLoggedIn, session?.accessToken]);

  const overrides = useMemo(() => getFavoriteOverrides(), [tick]);
  const items = useMemo(
    () => (isLoggedIn ? getFavoriteItems() : []),
    [tick, isLoggedIn]
  );

  const requireLogin = useCallback(() => {
    const next = pathname && pathname !== '/auth/login' ? pathname : '/';
    router.push(`/auth/login?next=${encodeURIComponent(next)}`);
  }, [pathname, router]);

  const apply = useCallback(
    <T extends CatalogProductCard>(list: T[]): T[] => {
      if (!isLoggedIn) {
        return list.map((item) =>
          item.isFavorite === true ? { ...item, isFavorite: false } : item
        );
      }
      return applyFavoriteOverrides(list, overrides);
    },
    [isLoggedIn, overrides]
  );

  const remember = useCallback(
    (list: CatalogProductCard[]) => {
      if (!isLoggedIn) return;
      rememberFavoriteCards(list);
    },
    [isLoggedIn]
  );

  const toggle = useCallback(
    (card: CatalogProductCard) => {
      if (!isLoggedIn) {
        requireLogin();
        return;
      }
      const repo = favoritesRepository;
      if (!repo) {
        requireLogin();
        return;
      }

      const willFavorite = toggleFavoriteLocal(card);
      void (async () => {
        try {
          const token =
            (await getValidAccessToken()) ?? session?.accessToken ?? null;
          if (!token) {
            requireLogin();
            return;
          }
          if (willFavorite) {
            await repo.add(card.id, token);
          } else {
            await repo.remove(card.id, token);
          }
        } catch {
          // Revert optimistic flip on failure.
          toggleFavoriteLocal({ ...card, isFavorite: willFavorite });
        }
      })();
    },
    [isLoggedIn, requireLogin, session?.accessToken]
  );

  const remove = useCallback(
    (id: AdvertId) => {
      if (!isLoggedIn) {
        requireLogin();
        return;
      }
      const repo = favoritesRepository;
      if (!repo) return;
      removeFavoriteLocal(id);
      void (async () => {
        try {
          const token =
            (await getValidAccessToken()) ?? session?.accessToken ?? null;
          if (!token) return;
          await repo.remove(id, token);
        } catch {
          // Leave local false; hydrate on next login refresh.
        }
      })();
    },
    [isLoggedIn, requireLogin, session?.accessToken]
  );

  return {
    items,
    count: items.length,
    hydrating,
    isLoggedIn,
    apply,
    remember,
    toggle,
    remove,
    requireLogin,
  };
}
