import { HttpClient } from '@/services/http';
import { getAuthSession } from '@/services/auth/sessionStore';
import { HttpCatalogRepository } from '@/services/catalog/HttpCatalogRepository';
import type { ICatalogRepository } from '@/services/catalog/CatalogRepository';
import {
  mapPublishedCardToCatalog,
  type BePublishedCard,
} from '@/services/adverts/mapPublishedCard';
import { normalizeBannerItem } from '@/services/banners/bannerDisplay';

import { locationLookup } from '@/services/location';
import { MOCK_HOMEPAGE } from '@/mocks/homepage';

import type {
  ActiveBannerItem,
  ActiveBannerListResponse,
  HomepageData,
} from '@/types';
import type {
  HomepageQueryOptions,
  IHomepageRepository,
} from './HomepageRepository';

type BeSearchResponse = {
  items: BePublishedCard[];
  nextCursor?: string | null;
  hasMore: boolean;
};

type BeShowcaseResponse = {
  seed: string;
  items: BePublishedCard[];
};

/**
 * HOMEPAGE advert feeds — yalnız BE.
 * İlan kartları mock’a düşmez; boş feed boş section demektir.
 * Kategoriler: HTTP catalog (app-wide mock singleton’a bağlanmaz).
 * Bannerlar: BE /v1/banners?placement=HOMEPAGE ile canlı getirilir; boş ise fallback mock'a düşer.
 */
export class HttpHomepageRepository implements IHomepageRepository {
  private readonly http: HttpClient;
  private readonly apiBase: string;
  private readonly catalog: ICatalogRepository;

  constructor(baseUrl: string, catalog?: ICatalogRepository) {
    this.http = new HttpClient(baseUrl);
    this.apiBase = baseUrl;
    this.catalog = catalog ?? new HttpCatalogRepository(baseUrl);
  }

  getCached(): HomepageData | null {
    return null;
  }

  async getHomepage(options?: HomepageQueryOptions): Promise<HomepageData> {
    const accessToken = getAuthSession()?.accessToken ?? undefined;
    try {
      return await this.fetchHomepageData(accessToken, options);
    } catch (err) {
      if (accessToken) {
        // If an authenticated request failed (e.g. 401 session revoked), retry as guest
        return await this.fetchHomepageData(undefined, options);
      }
      throw err;
    }
  }

  private async fetchHomepageData(
    accessToken?: string,
    options?: HomepageQueryOptions
  ): Promise<HomepageData> {
    const auth = accessToken ? { accessToken } : {};

    const [newPage, urgentPage, featuredPage, showcase, categories, bannersRes] =
      await Promise.all([
        this.http.request<BeSearchResponse>('/v1/homepage/new-adverts?limit=20', {
          method: 'GET',
          ...auth,
        }),
        this.http.request<BeSearchResponse>('/v1/homepage/urgent?limit=20', {
          method: 'GET',
          ...auth,
        }),
        this.http.request<BeSearchResponse>('/v1/homepage/featured?limit=20', {
          method: 'GET',
          ...auth,
        }),
        this.http.request<BeShowcaseResponse>('/v1/homepage/showcase?limit=20', {
          method: 'GET',
          ...auth,
        }),
        this.catalog.getCategoryTree({ fresh: Boolean(options?.fresh) }),
        Promise.all([
          this.http
            .request<ActiveBannerListResponse>('/v1/banners?placement=HOMEPAGE_HERO', {
              method: 'GET',
            })
            .catch(() => ({ items: [] as ActiveBannerItem[] })),
          this.http
            .request<ActiveBannerListResponse>('/v1/banners?placement=HOMEPAGE_PROMO', {
              method: 'GET',
            })
            .catch(() => ({ items: [] as ActiveBannerItem[] })),
          this.http
            .request<ActiveBannerListResponse>('/v1/banners?placement=HOMEPAGE', {
              method: 'GET',
            })
            .catch(() => ({ items: [] as ActiveBannerItem[] })),
        ]).then(([hero, promo, legacy]) => ({
          items: [...(hero?.items ?? []), ...(promo?.items ?? []), ...(legacy?.items ?? [])],
        })),
      ]);

    // Preload districts for all provinces present on the homepage cards so both district & province names resolve
    const provinceIds = new Set<string>();
    for (const card of [
      ...(urgentPage.items ?? []),
      ...(featuredPage.items ?? []),
      ...(newPage.items ?? []),
      ...(showcase.items ?? []),
    ]) {
      if (card.provinceId) provinceIds.add(card.provinceId);
    }
    if (provinceIds.size > 0) {
      await Promise.allSettled(
        Array.from(provinceIds).map((p) => locationLookup.listDistricts(p))
      );
    }

    const mapItems = (items: BePublishedCard[]) =>
      (items ?? []).map((item) => mapPublishedCardToCatalog(item, this.apiBase));

    const urgentAdverts = mapItems(urgentPage.items);
    const trending = mapItems(featuredPage.items);
    const newAdverts = mapItems(newPage.items);
    const showcaseItems = mapItems(showcase.items);

    const liveBanners = (bannersRes?.items ?? []).map((item) =>
      normalizeBannerItem(item, this.apiBase)
    );

    return {
      banners: liveBanners.length > 0 ? liveBanners : MOCK_HOMEPAGE.banners,
      categories,
      showcase: {
        seed: showcase.seed || 'live',
        items: showcaseItems.length > 0 ? showcaseItems : MOCK_HOMEPAGE.showcase.items,
      },
      newAdverts: newAdverts.length > 0 ? newAdverts : MOCK_HOMEPAGE.newAdverts,
      trending: trending.length > 0 ? trending : MOCK_HOMEPAGE.trending,
      specialOffers: showcaseItems.length > 0 ? showcaseItems : MOCK_HOMEPAGE.specialOffers,
      urgentAdverts: urgentAdverts.length > 0 ? urgentAdverts : MOCK_HOMEPAGE.urgentAdverts,
      macPromo: MOCK_HOMEPAGE.macPromo,
      salePromo: MOCK_HOMEPAGE.salePromo,
      brands: MOCK_HOMEPAGE.brands,
      blogVideos: MOCK_HOMEPAGE.blogVideos,
    };
  }
}


