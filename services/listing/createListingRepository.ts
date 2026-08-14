import { resolveApiBaseUrl } from '@/services/http';
import type { IListingRepository } from './ListingRepository';
import { HttpListingRepository } from './HttpListingRepository';
import { MockListingRepository } from './MockListingRepository';

/**
 * Varsayılan: mock.
 * HTTP: EXPO_PUBLIC_USE_HTTP_LISTING=1 ve EXPO_PUBLIC_API_URL.
 */
export function createListingRepository(): IListingRepository {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_LISTING === '1';
  const baseUrl = resolveApiBaseUrl();
  if (useHttp && baseUrl) {
    return new HttpListingRepository(baseUrl);
  }
  return new MockListingRepository();
}

export const listingRepository: IListingRepository = createListingRepository();
