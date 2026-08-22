import { HttpClient } from '@/services/http';
import { normalizeBannerItem } from '@/services/banners/bannerDisplay';
import type {
  ActiveBannerItem,
  ActiveBannerListResponse,
  BannerPlacement,
} from '@/types';
import type { IBannerRepository } from './BannerRepository';

/**
 * HTTP banner repository — GET /v1/banners?placement=...
 */
export class HttpBannerRepository implements IBannerRepository {
  private readonly http: HttpClient;
  private readonly apiBase: string;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
    this.apiBase = baseUrl;
  }

  async getActiveBanners(placement: BannerPlacement): Promise<ActiveBannerItem[]> {
    const res = await this.http.request<ActiveBannerListResponse>(
      `/v1/banners?placement=${encodeURIComponent(placement)}`,
      { method: 'GET' }
    );
    return (res.items ?? []).map((item) => normalizeBannerItem(item, this.apiBase));
  }
}
