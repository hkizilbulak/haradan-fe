import { HttpClient } from '@/services/http';
import { getAuthSession } from '@/services/auth/sessionStore';
import type { CatalogProductCard } from '@/types';
import type {
  IPublishedAdvertsRepository,
  PublishedAdvertsSearchParams,
} from './PublishedAdvertsRepository';
import { MockPublishedAdvertsRepository } from './MockPublishedAdvertsRepository';
import {
  mapPublishedCardToCatalog,
  type BePublishedCard,
} from './mapPublishedCard';

type BeSearchResponse = {
  items: BePublishedCard[];
  nextCursor?: string | null;
  hasMore: boolean;
};

const DEFAULT_PAGE_LIMIT = 50;
const DEFAULT_MAX_ITEMS = 200;

function buildQuery(params: {
  cursor?: string | null;
  limit: number;
  categoryId?: string;
  provinceId?: string;
  districtId?: string;
  horseId?: string;
  hasPhoto?: boolean;
}): string {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit));
  q.set('sort', 'newest');
  if (params.cursor) q.set('cursor', params.cursor);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.provinceId) q.set('provinceId', params.provinceId);
  if (params.districtId) q.set('districtId', params.districtId);
  if (params.horseId) q.set('horseId', params.horseId);
  if (params.hasPhoto != null) q.set('hasPhoto', String(params.hasPhoto));
  return q.toString();
}

/** ADVERT-PUBLIC-01 — cursor ile yayındaki ilan araması. */
export class HttpPublishedAdvertsRepository
  implements IPublishedAdvertsRepository
{
  private readonly http: HttpClient;

  constructor(private readonly baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async search(
    params: PublishedAdvertsSearchParams
  ): Promise<CatalogProductCard[]> {
    const accessToken =
      params.accessToken ?? getAuthSession()?.accessToken ?? null;
    const pageLimit = Math.min(
      Math.max(params.pageLimit ?? DEFAULT_PAGE_LIMIT, 1),
      100
    );
    const maxItems = params.maxItems ?? DEFAULT_MAX_ITEMS;

    const categoryIds =
      params.categoryIds && params.categoryIds.length > 0
        ? params.categoryIds
        : [undefined];
    const provinceIds =
      params.provinceIds && params.provinceIds.length > 0
        ? params.provinceIds
        : [undefined];

    try {
      const chunks = await Promise.all(
        categoryIds.flatMap((categoryId) =>
          provinceIds.map((provinceId) =>
            this.fetchStream(
              {
                categoryId,
                provinceId,
                districtId: params.districtId ?? undefined,
                horseId: params.horseId ?? undefined,
                hasPhoto: params.hasPhoto ?? undefined,
                pageLimit,
                maxItems,
              },
              accessToken
            )
          )
        )
      );

      const merged = new Map<string, CatalogProductCard>();
      for (const chunk of chunks) {
        for (const item of chunk) {
          merged.set(item.id, item);
        }
      }

      const res = [...merged.values()].sort((a, b) => {
        if (a.publishedAt === b.publishedAt) return a.id < b.id ? 1 : -1;
        return a.publishedAt < b.publishedAt ? 1 : -1;
      });

      if (res.length > 0) return res;
      return new MockPublishedAdvertsRepository().search(params);
    } catch {
      return new MockPublishedAdvertsRepository().search(params);
    }
  }

  private async fetchStream(
    opts: {
      categoryId?: string;
      provinceId?: string;
      districtId?: string;
      horseId?: string;
      hasPhoto?: boolean;
      pageLimit: number;
      maxItems: number;
    },
    accessToken: string | null
  ): Promise<CatalogProductCard[]> {
    const out: CatalogProductCard[] = [];
    let cursor: string | null = null;

    while (out.length < opts.maxItems) {
      const qs = buildQuery({
        cursor,
        limit: opts.pageLimit,
        categoryId: opts.categoryId,
        provinceId: opts.provinceId,
        districtId: opts.districtId,
        horseId: opts.horseId,
        hasPhoto: opts.hasPhoto,
      });
      const page = await this.http.request<BeSearchResponse>(
        `/v1/adverts?${qs}`,
        {
          method: 'GET',
          ...(accessToken ? { accessToken } : null),
        }
      );
      const mapped = (page.items ?? []).map((item) =>
        mapPublishedCardToCatalog(item, this.baseUrl)
      );
      out.push(...mapped);
      if (!page.hasMore || !page.nextCursor) break;
      cursor = page.nextCursor;
    }

    return out.slice(0, opts.maxItems);
  }
}
