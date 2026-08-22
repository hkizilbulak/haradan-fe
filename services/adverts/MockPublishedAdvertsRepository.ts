import { MOCK_CATALOG_PRODUCTS } from '@/mocks/homepage';
import { readMockDrafts, readMockItems } from '@/services/my-listings/mockListingStore';
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
    const drafts = readMockDrafts();
    const storedItems = readMockItems();
    const storedMap = new Map<string, typeof storedItems[0]>();
    storedItems.forEach((item) => storedMap.set(item.id, item));

    // 1. Process all stored items (both newly created and edited existing ones)
    const processedStored: CatalogProductCard[] = storedItems.map((card) => {
      const draft = drafts[card.id];
      return {
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
        properties: draft?.details?.properties || (card as any).properties || {},
      };
    });

    // 2. Base catalog products not yet in storedItems
    const otherBase: CatalogProductCard[] = MOCK_CATALOG_PRODUCTS
      .filter((p) => !storedMap.has(p.id))
      .map((p) => {
        const draft = drafts[p.id];
        return {
          ...p,
          properties: draft?.details?.properties || (p as any).properties || {},
        };
      });

    let list = [...processedStored, ...otherBase];


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
