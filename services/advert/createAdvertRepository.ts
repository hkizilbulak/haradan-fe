import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IAdvertRepository } from './AdvertRepository';
import { createHttpAdvertRepository } from './HttpAdvertRepository';
import { MockAdvertRepository } from './MockAdvertRepository';
import { createCachedAdvertRepository } from './CachedAdvertRepository';

export function createAdvertRepository(): IAdvertRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return createHttpAdvertRepository(baseUrl);
}

export const advertRepository: IAdvertRepository = createAdvertRepository();

