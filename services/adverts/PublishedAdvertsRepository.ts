import type { CatalogProductCard } from '@/types';

export type PublishedAdvertsSearchParams = {
  /** BE categoryId — tek kategori veya fan-out için liste. */
  categoryIds?: string[];
  provinceIds?: string[];
  districtId?: string | null;
  horseId?: string | null;
  hasPhoto?: boolean | null;
  /** Sayfa boyutu (BE limit, max 100). */
  pageLimit?: number;
  /** Toplam üst sınır (cursor ile çekilen). */
  maxItems?: number;
  accessToken?: string | null;
};

/**
 * Yayındaki ilan araması — ADVERT-PUBLIC-01.
 * GET /v1/adverts
 */
export interface IPublishedAdvertsRepository {
  search(
    params: PublishedAdvertsSearchParams
  ): Promise<CatalogProductCard[]>;
}
