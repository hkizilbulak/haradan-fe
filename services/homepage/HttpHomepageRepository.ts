import { HttpClient } from '@/services/http';
import { getValidAccessToken } from '@/services/auth/tokenRefresh';
import {
  mapPublishedCardToCatalog,
  type BePublishedCard,
} from '@/services/adverts/mapPublishedCard';
import { normalizeBannerItem } from '@/services/banners/bannerDisplay';

import type {
  ActiveBannerItem,
  CategoryTreeNode,
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

type BeHomepageBootstrap = {
  newAdverts: BeSearchResponse;
  urgent: BeSearchResponse;
  featured: BeSearchResponse;
  showcase: BeShowcaseResponse;
  banners: { items?: ActiveBannerItem[] };
  categories: { items?: CategoryTreeNode[] };
};

const HIDDEN_CATEGORY = {
  slug: 'ortak-alanlar',
  id: 'c1000000-0000-4000-8000-000000000000',
};

function filterCategories(items: CategoryTreeNode[] | undefined): CategoryTreeNode[] {
  return (items ?? []).filter(
    (node) =>
      node.slug !== HIDDEN_CATEGORY.slug &&
      node.id !== HIDDEN_CATEGORY.id &&
      !node.name?.toLowerCase().includes('ortak alan')
  );
}

/**
 * HOMEPAGE bootstrap — tek GET /v1/homepage.
 * İlan kartları mock’a düşmez; boş feed boş section demektir.
 * Bannerlar boş gelebilir; UI kendi fallback’ini kullanır.
 */
export class HttpHomepageRepository implements IHomepageRepository {
  private readonly http: HttpClient;
  private readonly apiBase: string;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
    this.apiBase = baseUrl;
  }

  getCached(): HomepageData | null {
    return null;
  }

  async getHomepage(options?: HomepageQueryOptions): Promise<HomepageData> {
    void options;
    const accessToken = (await getValidAccessToken()) ?? undefined;
    try {
      return await this.fetchHomepageData(accessToken);
    } catch (err) {
      if (accessToken) {
        // If an authenticated request failed (e.g. 401 session revoked), retry as guest
        return await this.fetchHomepageData(undefined);
      }
      throw err;
    }
  }

  private async fetchHomepageData(accessToken?: string): Promise<HomepageData> {
    const auth = accessToken ? { accessToken } : {};
    const bootstrap = await this.http.request<BeHomepageBootstrap>(
      '/v1/homepage?limit=20',
      { method: 'GET', ...auth }
    );

    const mapItems = (items: BePublishedCard[] | undefined) =>
      (items ?? []).map((item) => mapPublishedCardToCatalog(item, this.apiBase));

    const urgentAdverts = mapItems(bootstrap.urgent?.items);
    const trending = mapItems(bootstrap.featured?.items);
    const newAdverts = mapItems(bootstrap.newAdverts?.items);
    const showcaseItems = mapItems(bootstrap.showcase?.items);
    const categories = filterCategories(bootstrap.categories?.items);
    const liveBanners = (bootstrap.banners?.items ?? []).map((item) =>
      normalizeBannerItem(item, this.apiBase)
    );

    return {
      banners: liveBanners,
      categories,
      showcase: {
        seed: bootstrap.showcase?.seed || 'live',
        items: showcaseItems,
      },
      newAdverts,
      trending,
      specialOffers: showcaseItems,
      urgentAdverts,
      macPromo: {
        title: '',
        subtitle: '',
        ctaLabel: '',
        imageUrl: '',
      },
      salePromo: {
        discountLabel: '',
        title: '',
        code: '',
        imageUrl: '',
      },
      brands: [],
      blogVideos: [],
    };
  }
}
