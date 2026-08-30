import { HttpClient } from '@/services/http';
import { getValidAccessToken } from '@/services/auth/tokenRefresh';
import { locationLookup } from '@/services/location';
import type { CatalogProductCard } from '@/types';
import type {
  IPublishedAdvertsRepository,
  PublishedAdvertsSearchParams,
} from './PublishedAdvertsRepository';
import { HttpTjkRepository } from '@/services/tjk/HttpTjkRepository';
import type { ITjkRepository } from '@/services/tjk/TjkRepository';
import type { TjkHorseProfile } from '@/types/listing';
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
  private readonly tjkRepo: ITjkRepository;
  private static readonly horseCache = new Map<string, TjkHorseProfile>();

  constructor(private readonly baseUrl: string, tjkRepo?: ITjkRepository) {
    this.http = new HttpClient(baseUrl);
    this.tjkRepo = tjkRepo ?? new HttpTjkRepository(baseUrl);
  }

  async search(
    params: PublishedAdvertsSearchParams
  ): Promise<CatalogProductCard[]> {
    const accessToken =
      params.accessToken ?? (await getValidAccessToken()) ?? null;
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

      // Collect horseIds that need enrichment
      const horseIdsToFetch = new Set<string>();
      for (const item of merged.values()) {
        if (item.horseId && !HttpPublishedAdvertsRepository.horseCache.has(item.horseId)) {
          const props = item.properties || {};
          const hasColor = Boolean(props.COAT_COLOR || props.coatColor || props['Donu (Renk)']);
          const hasAge = Boolean(props.HORSE_AGE || props.age || props['Yaş']);
          if (!hasColor || !hasAge) {
            horseIdsToFetch.add(item.horseId);
          }
        }
      }

      if (horseIdsToFetch.size > 0) {
        await Promise.allSettled(
          Array.from(horseIdsToFetch).map(async (hId) => {
            try {
              const h = await this.tjkRepo.getById(hId);
              if (h) {
                HttpPublishedAdvertsRepository.horseCache.set(hId, h);
              }
            } catch {
              /* ignore */
            }
          })
        );
      }

      // Enrich cards with horse details
      for (const item of merged.values()) {
        if (item.horseId) {
          const horse = HttpPublishedAdvertsRepository.horseCache.get(item.horseId);
          if (horse) {
            const props = item.properties ? { ...item.properties } : {};
            if (!props.COAT_COLOR && !props.coatColor && horse.coatColor) {
              props.COAT_COLOR = horse.coatColor;
              props.coatColor = horse.coatColor;
            }
            if (!props.HORSE_BREED && !props.breed && horse.breed) {
              props.HORSE_BREED = horse.breed;
              props.breed = horse.breed;
            }
            if (!props.HORSE_GENDER && !props.gender && horse.gender) {
              props.HORSE_GENDER = horse.gender;
              props.gender = horse.gender;
            }
            if (
              (props.HORSE_AGE == null || props.HORSE_AGE === 0) &&
              (props.age == null || props.age === 0) &&
              horse.age
            ) {
              props.HORSE_AGE = horse.age;
              props.age = horse.age;
            }
            if (!item.brand && horse.breed) {
              item.brand = horse.breed;
            }
            item.properties = props;
          }
        }
      }

      return [...merged.values()].sort((a, b) => {
        if (a.publishedAt === b.publishedAt) return a.id < b.id ? 1 : -1;
        return a.publishedAt < b.publishedAt ? 1 : -1;
      });
    } catch {
      return [];
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
      // District preload yalnızca isim gelmeyen kartlar için (eski BE uyumu)
      const provinceIds = new Set<string>();
      for (const item of page.items ?? []) {
        if (item.provinceId && !item.provinceName && !item.districtName) {
          provinceIds.add(item.provinceId);
        }
      }
      if (provinceIds.size > 0) {
        await Promise.allSettled(
          Array.from(provinceIds).map((p) => locationLookup.listDistricts(p))
        );
      }

      out.push(...mapped);
      if (!page.hasMore || !page.nextCursor) break;
      cursor = page.nextCursor;
    }

    return out.slice(0, opts.maxItems);
  }
}
