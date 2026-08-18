import type { ActiveBannerItem, BannerPlacement } from '@/types';

/**
 * Banner veri sözleşmesi (DIP).
 * Mock → HttpBannerRepository ile değiştirilebilir; UI bileşenleri etkilenmez.
 */
export interface IBannerRepository {
  getActiveBanners(placement: BannerPlacement): Promise<ActiveBannerItem[]>;
}
