import type { CatalogProductCard } from '@/types';
import type { AdvertId } from '@/types/advertId';

export type FavoriteMutationResult = {
  advertId: AdvertId;
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
  add(advertId: AdvertId, accessToken: string): Promise<FavoriteMutationResult>;
  remove(advertId: AdvertId, accessToken: string): Promise<FavoriteMutationResult>;
}
