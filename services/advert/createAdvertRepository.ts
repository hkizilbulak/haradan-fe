import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IAdvertRepository } from './AdvertRepository';
import { createHttpAdvertRepository } from './HttpAdvertRepository';
import { MockAdvertRepository } from './MockAdvertRepository';
import { createCachedAdvertRepository } from './CachedAdvertRepository';

export function createAdvertRepository(): IAdvertRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_ADVERT)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return createHttpAdvertRepository(baseUrl);
  }
  return createCachedAdvertRepository(new MockAdvertRepository());
}

export const advertRepository: IAdvertRepository = createAdvertRepository();

