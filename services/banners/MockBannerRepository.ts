import { MOCK_BANNERS } from '@/mocks/homepage';
import type { ActiveBannerItem, BannerPlacement } from '@/types';
import type { IBannerRepository } from './BannerRepository';

const MOCK_LATENCY_MS = 200;

export class MockBannerRepository implements IBannerRepository {
  async getActiveBanners(placement: BannerPlacement): Promise<ActiveBannerItem[]> {
    await delay(MOCK_LATENCY_MS);
    return MOCK_BANNERS.filter((b) => b.placement === placement);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
