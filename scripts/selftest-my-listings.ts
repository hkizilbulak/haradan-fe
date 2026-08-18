/**
 * İlanlarım + ilan detay mapper self-test.
 * Çalıştır: npm run selftest:my-listings
 */
import { mediaDeliveryUrl, resolvePublicMediaUrl } from '../services/media/publicUrl';
import { mapOwnerAdvertToCard } from '../services/my-listings/mapOwnerAdvert';
import {
  backendStatusesForTab,
  canSoftDeleteDraft,
  toMyListingTab,
} from '../services/my-listings/statusTabs';
import {
  mapOwnerToAdvertDetail,
  mapPublishedDetailToAdvert,
} from '../services/advert/mapAdvertDetail';
import { HttpMyListingsRepository } from '../services/my-listings/HttpMyListingsRepository';
import { MockMyListingsRepository } from '../services/my-listings/MockMyListingsRepository';
import { ApiError } from '../services/http';

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
assertEqual(card.backendStatus, 'PENDING_REVIEW', 'card keeps BE status');
assertEqual(card.version, 2, 'card version');
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

assert(canSoftDeleteDraft('DRAFT'), 'DRAFT can soft-delete');
assert(canSoftDeleteDraft('CHANGES_REQUESTED'), 'CHANGES_REQUESTED can soft-delete');
assert(canSoftDeleteDraft('PUBLISHED'), 'PUBLISHED can soft-delete');
assert(canSoftDeleteDraft('ARCHIVED'), 'ARCHIVED can soft-delete');

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
const responses: Record<string, { status: number; body: unknown }> = {};

function keyOf(url: string, method: string): string {
  return `${method} ${url.replace(/^https?:\/\/[^/]+/, '')}`;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  calls.push({ url, init: init ?? {} });
  const hit = responses[keyOf(url, method)];
  if (!hit) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
  }
  return new Response(JSON.stringify(hit.body), {
    status: hit.status,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

async function main(): Promise<void> {
  const mock = new MockMyListingsRepository();
  const listed = await mock.list('draft', 'tok');
  assert(listed.items.length >= 1, 'mock has draft');
  const draft = listed.items[0];
  assertEqual(draft?.backendStatus, 'DRAFT', 'mock draft backendStatus');
  assertEqual(draft?.version, 1, 'mock draft version');

  await mock.removeDraft(draft.id, draft.version, 'tok');
  const afterDelete = await mock.list('draft', 'tok');
  assert(
    !afterDelete.items.some((item) => item.id === draft.id),
    'mock delete removes draft from list'
  );

  const gone = await mock
    .removeDraft(draft.id, 1, 'tok')
    .then(() => null)
    .catch((err: unknown) => err);
  assert(gone instanceof ApiError && gone.status === 404, 'second delete is 404');

  const publishedCard = (await mock.list('published', 'tok')).items[0];
  await mock.removeDraft(publishedCard.id, publishedCard.version, 'tok');
  const publishedAfterDelete = await mock.list('published', 'tok');
  assert(
    !publishedAfterDelete.items.some((item) => item.id === publishedCard.id),
    'published delete removes listing from list'
  );

  const leftover = new MockMyListingsRepository();
  const leftoverDraft = (await leftover.list('draft', 'tok')).items[0];
  const stale = await leftover
    .removeDraft(leftoverDraft.id, leftoverDraft.version + 9, 'tok')
    .then(() => null)
    .catch((err: unknown) => err);
  assert(
    stale instanceof ApiError && stale.code === 'STALE_VERSION',
    'stale expectedVersion is STALE_VERSION'
  );
  const stillThere = await leftover.list('draft', 'tok');
  assert(
    stillThere.items.some((item) => item.id === leftoverDraft.id),
    'stale delete does not drop draft'
  );

  const http = new HttpMyListingsRepository('http://localhost:8080/api');
  responses['DELETE /api/v1/me/adverts/adv-draft?expectedVersion=3'] = {
    status: 200,
    body: {
      id: 'adv-draft',
      status: 'DRAFT',
      version: 4,
      mediaVersion: 1,
      deletedAt: '2026-08-18T10:00:00Z',
    },
  };
  await http.removeDraft('adv-draft', 3, 'tok');
  const del = calls.find((c) => (c.init.method ?? 'GET').toUpperCase() === 'DELETE');
  assert(del != null, 'http DELETE called');
  assert(
    del?.url.endsWith('/v1/me/adverts/adv-draft?expectedVersion=3'),
    'DELETE path + expectedVersion query'
  );
  const auth = new Headers(del?.init.headers);
  assertEqual(auth.get('Authorization'), 'Bearer tok', 'DELETE sends Bearer');

  const badVersion = await http
    .removeDraft('adv-draft', 0, 'tok')
    .then(() => null)
    .catch((err: unknown) => err);
  assert(
    badVersion instanceof ApiError && badVersion.code === 'VALIDATION_ERROR',
    'expectedVersion < 1 is VALIDATION_ERROR'
  );

  responses['DELETE /api/v1/me/adverts/adv-pub?expectedVersion=1'] = {
    status: 200,
    body: {
      id: 'adv-pub',
      status: 'PUBLISHED',
      version: 2,
      mediaVersion: 1,
      deletedAt: '2026-08-18T10:00:00Z',
    },
  };
  await http.removeDraft('adv-pub', 1, 'tok');
  const pubDel = calls.find((c) => c.url.includes('adv-pub'));
  assert(pubDel != null, 'http DELETE for published listing called');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
