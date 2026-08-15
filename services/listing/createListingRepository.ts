import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IListingRepository } from './ListingRepository';
import { HttpListingRepository } from './HttpListingRepository';
import { MockListingRepository } from './MockListingRepository';

export function createListingRepository(): IListingRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_LISTING)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpListingRepository(baseUrl);
  }
  return new MockListingRepository();
}

export const listingRepository: IListingRepository = createListingRepository();
