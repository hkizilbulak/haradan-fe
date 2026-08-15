import { HttpClient } from '@/services/http';
import {
  mapPublishedCardToCatalog,
  type BePublishedCard,
} from '@/services/adverts/mapPublishedCard';
import type { CatalogProductCard } from '@/types';
import type {
  FavoriteListResult,
  FavoriteMutationResult,
  IFavoritesRepository,
} from './FavoritesRepository';

type BeFavoriteMutation = {
  advertId: string;
  favorited: boolean;
};

type BeFavoriteListItem = {
  advertId: string;
  available: boolean;
  card?: BePublishedCard | null;
  unavailableReason?: string | null;
};

type BeFavoriteListResponse = {
  items: BeFavoriteListItem[];
  nextCursor?: string | null;
  hasMore: boolean;
};

/** FAVORITE-01..03 — Bearer zorunlu. */
export class HttpFavoritesRepository implements IFavoritesRepository {
  private readonly http: HttpClient;
  private readonly apiBase: string;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
    this.apiBase = baseUrl;
  }

  async list(accessToken: string): Promise<FavoriteListResult> {
    const items: CatalogProductCard[] = [];
    let cursor: string | null | undefined = undefined;
    let hasMore = true;
    let guard = 0;

    while (hasMore && guard < 20) {
      guard += 1;
      const q = new URLSearchParams({ limit: '100' });
      if (cursor) q.set('cursor', cursor);
      const page = await this.http.request<BeFavoriteListResponse>(
        `/v1/me/favorites?${q.toString()}`,
        { method: 'GET', accessToken }
      );
      for (const row of page.items ?? []) {
        if (!row.available || !row.card) continue;
        items.push(
          mapPublishedCardToCatalog(
            { ...row.card, isFavorite: true },
            this.apiBase
          )
        );
      }
      hasMore = page.hasMore === true;
      cursor = page.nextCursor;
      if (!hasMore) break;
    }

    return { items, hasMore: false, nextCursor: null };
  }

  async add(
    advertId: string,
    accessToken: string
  ): Promise<FavoriteMutationResult> {
    const res = await this.http.request<BeFavoriteMutation>(
      `/v1/me/favorites/${encodeURIComponent(advertId)}`,
      { method: 'PUT', accessToken }
    );
    return { advertId: res.advertId, favorited: res.favorited };
  }

  async remove(
    advertId: string,
    accessToken: string
  ): Promise<FavoriteMutationResult> {
    const res = await this.http.request<BeFavoriteMutation>(
      `/v1/me/favorites/${encodeURIComponent(advertId)}`,
      { method: 'DELETE', accessToken }
    );
    return { advertId: res.advertId, favorited: res.favorited };
  }
}
