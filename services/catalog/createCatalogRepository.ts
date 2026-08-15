import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { ICatalogRepository } from './CatalogRepository';
import { createCachedCatalogRepository } from './CachedCatalogRepository';
import { HttpCatalogRepository } from './HttpCatalogRepository';
import { MockCatalogRepository } from './MockCatalogRepository';

export function createCatalogRepository(): ICatalogRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_CATALOG)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) {
      return createCachedCatalogRepository(new HttpCatalogRepository(baseUrl));
    }
  }
  return createCachedCatalogRepository(new MockCatalogRepository());
}

export const catalogRepository: ICatalogRepository = createCatalogRepository();
