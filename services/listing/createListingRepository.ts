import { resolveApiBaseUrl } from '@/services/http';
import type { IListingRepository } from './ListingRepository';
import { HttpListingRepository } from './HttpListingRepository';
import { MockListingRepository } from './MockListingRepository';

export function createListingRepository(): IListingRepository {
  const baseUrl = resolveApiBaseUrl() || 'http://localhost:8080/api';
  if (
    process.env.EXPO_PUBLIC_USE_MOCK_LISTING === '1' ||
    process.env.EXPO_PUBLIC_USE_MOCK_API === '1'
  ) {
    return new MockListingRepository();
  }
  return new HttpListingRepository(baseUrl);
}

export const listingRepository: IListingRepository = createListingRepository();

