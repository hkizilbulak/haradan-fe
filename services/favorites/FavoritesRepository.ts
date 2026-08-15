import type { CatalogProductCard } from '@/types';

export type FavoriteMutationResult = {
  advertId: string;
  favorited: boolean;
};

export type FavoriteListResult = {
  items: CatalogProductCard[];
  hasMore: boolean;
  nextCursor?: string | null;
};

/**
 * Favoriler veri sözleşmesi (DIP).
 * Kaynak: BE GET/PUT/DELETE /v1/me/favorites — mock kalp durumu yok.
 */
export interface IFavoritesRepository {
  list(accessToken: string): Promise<FavoriteListResult>;
  add(advertId: string, accessToken: string): Promise<FavoriteMutationResult>;
  remove(advertId: string, accessToken: string): Promise<FavoriteMutationResult>;
}
