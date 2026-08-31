import { MOCK_HOMEPAGE } from '@/mocks/homepage';
import type { CatalogProductCard, MyListingCard, MyListingStatus } from '@/types';
import type { AdvertId } from '@/types/advertId';

export const DEMO_SELLER_ID = 'user-demo';

function uniqueCards(): CatalogProductCard[] {
  const list = [
    ...MOCK_HOMEPAGE.newAdverts,
    ...MOCK_HOMEPAGE.trending,
    ...MOCK_HOMEPAGE.specialOffers,
    ...MOCK_HOMEPAGE.urgentAdverts,
  ];
  return list.filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index
  );
}

function mustCard(id: AdvertId): CatalogProductCard {
  const found = uniqueCards().find((c) => c.id === id);
  if (!found) {
    throw new Error(`Mock ilan bulunamadı: ${id}`);
  }
  return found;
}

const BACKEND_STATUS: Record<MyListingStatus, string> = {
  published: 'PUBLISHED',
  pending: 'PENDING_REVIEW',
  rejected: 'REJECTED',
  draft: 'DRAFT',
  sold: 'SOLD',
};

function mine(
  id: AdvertId,
  status: MyListingStatus,
  extra?: Partial<Pick<MyListingCard, 'updatedAt' | 'soldAt' | 'version'>>
): MyListingCard {
  const base = mustCard(id);
  return {
    ...base,
    status,
    backendStatus: BACKEND_STATUS[status],
    version: extra?.version ?? 1,
    sellerId: DEMO_SELLER_ID,
    updatedAt: extra?.updatedAt ?? base.publishedAt,
    soldAt: extra?.soldAt ?? null,
  };
}

/** Demo kullanıcının ilanları — GET /v1/me/adverts?status= */
export const MOCK_MY_LISTINGS: MyListingCard[] = [
  mine(1001, 'published'),
  mine(1002, 'published'),
  mine(1006, 'published'),
  mine(1003, 'pending', {
    updatedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  }),
  mine(1009, 'rejected', {
    updatedAt: new Date(Date.now() - 30 * 3_600_000).toISOString(),
  }),
  mine(1008, 'draft', {
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  }),
  mine(1004, 'sold', {
    soldAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  }),
  mine(1007, 'sold', {
    soldAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
  }),
];

export const MY_LISTING_IDS = new Set<AdvertId>(MOCK_MY_LISTINGS.map((i) => i.id));
