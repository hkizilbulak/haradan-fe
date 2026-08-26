import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IHomepageRepository } from './HomepageRepository';
import { createCachedHomepageRepository } from './CachedHomepageRepository';
import { HttpHomepageRepository } from './HttpHomepageRepository';
import { MockHomepageRepository } from './MockHomepageRepository';

export function createHomepageRepository(): IHomepageRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_HOMEPAGE)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) {
      return createCachedHomepageRepository(new HttpHomepageRepository(baseUrl));
    }
  }
  return createCachedHomepageRepository(new MockHomepageRepository());
}

