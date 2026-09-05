import type { AdvertDetail } from '@/types';
import type { AdvertId } from '@/types/advertId';
import { getMockAdvertDetail } from '@/mocks/advertDetail';
import type { AdvertQueryOptions, IAdvertRepository } from './AdvertRepository';

const MOCK_LATENCY_MS = 380;

export class MockAdvertRepository implements IAdvertRepository {
  getCached(_id: AdvertId): AdvertDetail | null {
    return null;
  }

  invalidate(_id?: AdvertId): void {
    // No-op for mock repository
  }


  async getById(id: AdvertId, _options?: AdvertQueryOptions): Promise<AdvertDetail> {
    await delay(MOCK_LATENCY_MS);
    return getMockAdvertDetail(id);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
