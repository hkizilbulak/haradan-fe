import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { ICatalogRepository } from './CatalogRepository';
import { createCachedCatalogRepository } from './CachedCatalogRepository';
import { HttpCatalogRepository } from './HttpCatalogRepository';
import { MockCatalogRepository } from './MockCatalogRepository';

export function createCatalogRepository(): ICatalogRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return createCachedCatalogRepository(new HttpCatalogRepository(baseUrl));
}

export const catalogRepository: ICatalogRepository = createCatalogRepository();

