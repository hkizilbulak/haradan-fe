import { MOCK_CATALOG_PRODUCTS } from '@/mocks/homepage';
import type { CatalogProductCard } from '@/types';
import type {
  IPublishedAdvertsRepository,
  PublishedAdvertsSearchParams,
} from './PublishedAdvertsRepository';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockPublishedAdvertsRepository
  implements IPublishedAdvertsRepository
{
  async search(
    params: PublishedAdvertsSearchParams
  ): Promise<CatalogProductCard[]> {
    await wait(180);
    let list = MOCK_CATALOG_PRODUCTS.map((p) => ({ ...p }));

    if (params.categoryIds && params.categoryIds.length > 0) {
      const set = new Set(params.categoryIds);
      list = list.filter((p) => set.has(p.categoryId));
    }
    if (params.provinceIds && params.provinceIds.length > 0) {
      const set = new Set(params.provinceIds);
      list = list.filter((p) => set.has(p.provinceId));
    }
    if (params.hasPhoto === true) {
      list = list.filter((p) => Boolean(p.cover?.publicUrl));
    }
    if (params.hasPhoto === false) {
      list = list.filter((p) => !p.cover?.publicUrl);
    }

    return list.sort((a, b) =>
      a.publishedAt < b.publishedAt ? 1 : -1
    );
  }
}
