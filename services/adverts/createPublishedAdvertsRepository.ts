import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IPublishedAdvertsRepository } from './PublishedAdvertsRepository';
import { HttpPublishedAdvertsRepository } from './HttpPublishedAdvertsRepository';
import { MockPublishedAdvertsRepository } from './MockPublishedAdvertsRepository';

export function createPublishedAdvertsRepository(): IPublishedAdvertsRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return new HttpPublishedAdvertsRepository(baseUrl);
}

export const publishedAdvertsRepository: IPublishedAdvertsRepository =
  createPublishedAdvertsRepository();

