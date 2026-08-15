import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IPublishedAdvertsRepository } from './PublishedAdvertsRepository';
import { HttpPublishedAdvertsRepository } from './HttpPublishedAdvertsRepository';
import { MockPublishedAdvertsRepository } from './MockPublishedAdvertsRepository';

export function createPublishedAdvertsRepository(): IPublishedAdvertsRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_ADVERTS_SEARCH)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpPublishedAdvertsRepository(baseUrl);
  }
  return new MockPublishedAdvertsRepository();
}

export const publishedAdvertsRepository: IPublishedAdvertsRepository =
  createPublishedAdvertsRepository();
