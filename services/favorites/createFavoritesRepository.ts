import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IFavoritesRepository } from './FavoritesRepository';
import { HttpFavoritesRepository } from './HttpFavoritesRepository';

/**
 * Favoriler yalnız HTTP + login ile çalışır.
 * Mock kalp store yoktur; API URL yoksa null (UI login ister / boş gösterir).
 */
export function createFavoritesRepository(): IFavoritesRepository | null {
  if (!isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_FAVORITES)) {
    return null;
  }
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) return null;
  return new HttpFavoritesRepository(baseUrl);
}

export const favoritesRepository: IFavoritesRepository | null =
  createFavoritesRepository();
