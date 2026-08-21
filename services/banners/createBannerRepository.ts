import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IBannerRepository } from './BannerRepository';
import { HttpBannerRepository } from './HttpBannerRepository';
import { MockBannerRepository } from './MockBannerRepository';

export function createBannerRepository(): IBannerRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return new HttpBannerRepository(baseUrl);
}

export const bannerRepository: IBannerRepository = createBannerRepository();

