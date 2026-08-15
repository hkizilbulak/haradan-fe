import type { HomepageData } from '@/types';
import { MOCK_HOMEPAGE } from '@/mocks/homepage';
import type {
  HomepageQueryOptions,
  IHomepageRepository,
} from './HomepageRepository';

const MOCK_LATENCY_MS = 450;

/**
 * Mock implementasyon — haradan-be alanlarıyla birebir.
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
