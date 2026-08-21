import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IHomepageRepository } from './HomepageRepository';
import { createCachedHomepageRepository } from './CachedHomepageRepository';
import { HttpHomepageRepository } from './HttpHomepageRepository';
import { MockHomepageRepository } from './MockHomepageRepository';

export function createHomepageRepository(): IHomepageRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return createCachedHomepageRepository(new HttpHomepageRepository(baseUrl));
}

