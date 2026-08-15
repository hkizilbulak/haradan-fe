/**
 * İlanlarım + ilan detay mapper self-test.
 * Çalıştır: npm run selftest:my-listings
 */
import { mediaDeliveryUrl, resolvePublicMediaUrl } from '../services/media/publicUrl';
import { mapOwnerAdvertToCard } from '../services/my-listings/mapOwnerAdvert';
import {
  backendStatusesForTab,
  toMyListingTab,
} from '../services/my-listings/statusTabs';
import {
  mapOwnerToAdvertDetail,
  mapPublishedDetailToAdvert,
} from '../services/advert/mapAdvertDetail';

let failed = 0;
let passed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

assertEqual(toMyListingTab('PUBLISHED'), 'published', 'PUBLISHED → published');
assertEqual(toMyListingTab('SOLD'), 'sold', 'SOLD → sold');
assertEqual(toMyListingTab('PENDING_REVIEW'), 'pending', 'PENDING → pending');
assertEqual(toMyListingTab('REJECTED'), 'rejected', 'REJECTED → rejected');
assertEqual(toMyListingTab('DRAFT'), 'draft', 'DRAFT → draft');
assertEqual(toMyListingTab('CHANGES_REQUESTED'), 'draft', 'CHANGES → draft');
assertEqual(
  backendStatusesForTab('pending')[0],
  'PENDING_REVIEW',
  'pending fetches PENDING_REVIEW'
);
assertEqual(
  backendStatusesForTab('rejected')[0],
  'REJECTED',
  'rejected fetches REJECTED'
);
assert(
  !backendStatusesForTab('draft').includes('PENDING_REVIEW'),
  'draft no longer includes PENDING_REVIEW'
);
assertEqual(backendStatusesForTab('published').length, 1, 'published single status');

const apiBase = 'http://localhost:8080/api';
assertEqual(
  resolvePublicMediaUrl('/v1/media/a/DETAIL', apiBase),
  'http://localhost:8080/api/v1/media/a/DETAIL',
  'relative media url'
);
assertEqual(
  mediaDeliveryUrl('asset-1', 'DETAIL', apiBase),
  'http://localhost:8080/api/v1/media/asset-1/DETAIL',
  'delivery url'
);

const card = mapOwnerAdvertToCard(
  {
    id: 'adv-1',
    status: 'PENDING_REVIEW',
    version: 2,
    mediaVersion: 1,
    categoryId: 'cat-1',
    districtId: 'dist-1',
    provinceId: 'prov-1',
    horseId: null,
    title: 'Test At',
    description: 'Açıklama',
    price: { amountMinor: 1500000, currency: 'TRY' },
    properties: {},
    media: [
      {
        assetId: 'media-1',
        displayOrder: 0,
        isCover: true,
        lifecycleStatus: 'MASTER_READY',
      },
    ],
    publishedAt: null,
    updatedAt: '2026-08-15T10:00:00Z',
  },
  { apiBase, sellerId: 'user-1' }
);
assertEqual(card.status, 'pending', 'card tab from PENDING');
assertEqual(card.provinceId, 'prov-1', 'province on card');
assert(
  card.cover?.publicUrl.includes('/v1/media/media-1/DETAIL'),
  'cover delivery url'
);

const skipPendingCover = mapOwnerAdvertToCard(
  {
    id: 'adv-pending-cover',
    status: 'PENDING_REVIEW',
    version: 1,
    mediaVersion: 1,
    categoryId: 'cat-1',
    districtId: 'dist-1',
    provinceId: 'prov-1',
    horseId: null,
    title: 'Pending cover',
    description: null,
    price: null,
    properties: {},
    media: [
      {
        assetId: 'not-ready',
        displayOrder: 0,
        isCover: true,
        lifecycleStatus: 'UPLOAD_PENDING',
      },
      {
        assetId: 'ready',
        displayOrder: 1,
        isCover: false,
        lifecycleStatus: 'MASTER_READY',
      },
    ],
    updatedAt: '2026-08-15T10:00:00Z',
  },
  { apiBase, sellerId: 'user-1' }
);
assertEqual(
  skipPendingCover.cover?.assetId,
  'ready',
  'owner card prefers MASTER_READY over isCover pending'
);

const detail = mapOwnerToAdvertDetail(
  {
    id: 'adv-1',
    status: 'DRAFT',
    version: 1,
    mediaVersion: 1,
    categoryId: 'cat-1',
    districtId: 'dist-1',
    provinceId: 'prov-1',
    horseId: null,
    title: 'Taslak',
    description: 'Desc',
    price: null,
    properties: {},
    media: [],
    updatedAt: '2026-08-15T10:00:00Z',
  },
  apiBase,
  'user-1'
);
assertEqual(detail.sellerId, 'user-1', 'owner detail sellerId');
assertEqual(detail.title, 'Taslak', 'owner detail title');

const published = mapPublishedDetailToAdvert(
  {
    id: 'adv-2',
    title: 'Yayın',
    description: 'Public desc',
    publishedAt: '2026-08-01T00:00:00Z',
    price: { amountMinor: 100, currency: 'TRY' },
    category: { id: 'c', name: 'Safkan', slug: 'safkan' },
    location: {
      districtId: 'd',
      districtName: 'Çankaya',
      provinceId: 'p',
      provinceName: 'Ankara',
    },
    horse: null,
    media: [
      {
        assetId: 'm',
        displayOrder: 0,
        isCover: true,
        publicUrl: '/v1/media/m/DETAIL',
      },
    ],
    properties: [],
    isFavorite: false,
    isUrgent: false,
  },
  apiBase,
  'user-1'
);
assert(
  published.gallery[0]?.publicUrl.startsWith(apiBase),
  'published gallery absolutized'
);
assertEqual(published.provinceId, 'p', 'published province');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
