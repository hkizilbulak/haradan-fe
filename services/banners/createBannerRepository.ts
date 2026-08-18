import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IBannerRepository } from './BannerRepository';
import { HttpBannerRepository } from './HttpBannerRepository';
import { MockBannerRepository } from './MockBannerRepository';

export function createBannerRepository(): IBannerRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_BANNERS)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) {
      return new HttpBannerRepository(baseUrl);
    }
  }
  return new MockBannerRepository();
}

export const bannerRepository: IBannerRepository = createBannerRepository();
