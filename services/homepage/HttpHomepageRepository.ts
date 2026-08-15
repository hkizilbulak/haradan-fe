import { HttpClient } from '@/services/http';
import { getAuthSession } from '@/services/auth/sessionStore';
import { HttpCatalogRepository } from '@/services/catalog/HttpCatalogRepository';
import type { ICatalogRepository } from '@/services/catalog/CatalogRepository';
import {
  mapPublishedCardToCatalog,
  type BePublishedCard,
} from '@/services/adverts/mapPublishedCard';
import { MOCK_HOMEPAGE } from '@/mocks/homepage';
import type { HomepageData } from '@/types';
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
 * Banner/promo/blog: henüz ayrı chrome API’si yok (UI placeholder).
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

  async getHomepage(_options?: HomepageQueryOptions): Promise<HomepageData> {
    const accessToken = getAuthSession()?.accessToken ?? undefined;
    const auth = accessToken ? { accessToken } : {};

    const [newPage, urgentPage, featuredPage, showcase, categories] =
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
        this.catalog.getCategoryTree(),
      ]);

    const mapItems = (items: BePublishedCard[]) =>
      (items ?? []).map((item) => mapPublishedCardToCatalog(item, this.apiBase));

    const urgentAdverts = mapItems(urgentPage.items);
    const trending = mapItems(featuredPage.items);
    const newAdverts = mapItems(newPage.items);
    const showcaseItems = mapItems(showcase.items);

    return {
      banners: MOCK_HOMEPAGE.banners,
      categories,
      showcase: {
        seed: showcase.seed || 'live',
        items: showcaseItems,
      },
      newAdverts,
      trending,
      specialOffers: showcaseItems,
      urgentAdverts,
      macPromo: MOCK_HOMEPAGE.macPromo,
      salePromo: MOCK_HOMEPAGE.salePromo,
      brands: MOCK_HOMEPAGE.brands,
      blogVideos: MOCK_HOMEPAGE.blogVideos,
    };
  }
}
