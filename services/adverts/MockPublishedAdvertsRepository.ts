import { MOCK_CATALOG_PRODUCTS } from '@/mocks/homepage';
import { readMockItems } from '@/services/my-listings/mockListingStore';
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
    const userItems: CatalogProductCard[] = readMockItems()
      .filter((card) => !MOCK_CATALOG_PRODUCTS.some((p) => p.id === card.id))
      .map((card) => ({
        id: card.id,
        title: card.title,
        publishedAt: card.publishedAt ?? card.updatedAt ?? new Date().toISOString(),
        price: card.price,
        categoryId: card.categoryId,
        districtId: card.districtId,
        provinceId: card.provinceId,
        horseId: card.horseId ?? null,
        cover: card.cover,
        isFavorite: card.isFavorite,
        packageCode: card.packageCode ?? null,
        packageDisplayName: card.packageDisplayName ?? null,
        packageBadgeText: card.packageBadgeText ?? null,
        isUrgent: Boolean(card.isUrgent),
        urgentActivatedAt: card.urgentActivatedAt ?? null,
        isFeatured: Boolean(card.isFeatured),
        featuredUntil: card.featuredUntil ?? null,
        rating: card.rating ?? 5,
        reviewCount: card.reviewCount ?? 0,
        viewCount: card.viewCount ?? 0,
        oldPrice: card.oldPrice ?? null,
        available: card.available ?? null,
        brand: card.brand ?? null,
      }));

    let list = [...userItems, ...MOCK_CATALOG_PRODUCTS.map((p) => ({ ...p }))];

    if (params.categoryIds && params.categoryIds.length > 0) {
      const set = new Set(params.categoryIds);
      list = list.filter((p) => set.has(p.categoryId));
    }
    if (params.provinceIds && params.provinceIds.length > 0) {
      const set = new Set(params.provinceIds);
      list = list.filter((p) => set.has(p.provinceId));
    }
    if (params.districtId) {
      list = list.filter((p) => p.districtId === params.districtId);
    }
    if (params.horseId) {
      list = list.filter((p) => p.horseId === params.horseId);
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
