import type { AdvertDetail } from '@/types';
import { getMockAdvertDetail } from '@/mocks/advertDetail';
import type { AdvertQueryOptions, IAdvertRepository } from './AdvertRepository';

const MOCK_LATENCY_MS = 380;

export class MockAdvertRepository implements IAdvertRepository {
  getCached(_id: string): AdvertDetail | null {
    return null;
  }

  async getById(id: string, _options?: AdvertQueryOptions): Promise<AdvertDetail> {
    await delay(MOCK_LATENCY_MS);
    return getMockAdvertDetail(id);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
