import type { HomepageData } from '@/types';
import { MOCK_HOMEPAGE } from '@/mocks/homepage';
import type {
  HomepageQueryOptions,
  IHomepageRepository,
} from './HomepageRepository';
import { createCachedHomepageRepository } from './CachedHomepageRepository';

const MOCK_LATENCY_MS = 450;

/**
 * Mock implementasyon — haradan-be alanlarıyla birebir.
 * HttpHomepageRepository eklendiğinde DI ile değiştirilir.
 */
export class MockHomepageRepository implements IHomepageRepository {
  getCached(): HomepageData | null {
    return null;
  }

  async getHomepage(_options?: HomepageQueryOptions): Promise<HomepageData> {
    await delay(MOCK_LATENCY_MS);
    return MOCK_HOMEPAGE;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Uygulama genelinde kullanılan varsayılan repository örneği. */
export const homepageRepository: IHomepageRepository =
  createCachedHomepageRepository(new MockHomepageRepository());
