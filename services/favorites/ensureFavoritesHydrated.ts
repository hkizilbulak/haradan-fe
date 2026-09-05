import { getValidAccessToken } from '@/services/auth';
import type { IFavoritesRepository } from './FavoritesRepository';
import { favoritesRepository } from './createFavoritesRepository';
import { replaceFavoritesFromServer } from './favoriteStore';

const HYDRATE_TTL_MS = 60_000;

let hydratedAt = 0;
let hydratedTokenFingerprint: string | null = null;
let inflight: Promise<void> | null = null;

function tokenFingerprint(token: string): string {
  // Avoid storing full JWT in module state; short stable key is enough for dedupe.
  return `${token.length}:${token.slice(0, 12)}:${token.slice(-8)}`;
}

/** Logout / session clear — next login must refetch. */
export function resetFavoritesHydration(): void {
  hydratedAt = 0;
  hydratedTokenFingerprint = null;
  inflight = null;
}

export type EnsureFavoritesHydratedOptions = {
  repo?: IFavoritesRepository | null;
  getToken?: () => Promise<string | null>;
  /** Test / force refresh */
  fresh?: boolean;
};

/**
 * Tek GET /v1/me/favorites — tüm useFavorites mount'ları aynı inflight/TTL paylaşır.
 * Session token hydrate veya AppHeader+Drawers+Page üçlüsü çift çağrı yapmaz.
 */
export async function ensureFavoritesHydrated(
  accessTokenHint?: string | null,
  options?: EnsureFavoritesHydratedOptions
): Promise<void> {
  const repo = options?.repo !== undefined ? options.repo : favoritesRepository;
  if (!repo) return;

  const resolveToken =
    options?.getToken ??
    (async () => (await getValidAccessToken()) ?? accessTokenHint ?? null);
  const token = await resolveToken();
  if (!token) {
    // Token henüz hydrate olmadıysa local state'i silme — logout path clear eder.
    return;
  }

  const fp = tokenFingerprint(token);
  const now = Date.now();
  if (
    !options?.fresh &&
    hydratedTokenFingerprint === fp &&
    now - hydratedAt < HYDRATE_TTL_MS &&
    !inflight
  ) {
    return;
  }

  if (inflight && hydratedTokenFingerprint === fp && !options?.fresh) {
    return inflight;
  }

  hydratedTokenFingerprint = fp;
  inflight = (async () => {
    try {
      const result = await repo.list(token);
      replaceFavoritesFromServer(result.items);
      hydratedAt = Date.now();
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
