/**
 * Paket özellikleri + anasayfa feed mapping self-test.
 * Çalıştır: npm run selftest:package-features
 */
import { HttpHomepageRepository } from '../services/homepage/HttpHomepageRepository';
import { HttpListingRepository } from '../services/listing/HttpListingRepository';
import { mapPublishedCardToCatalog } from '../services/adverts/mapPublishedCard';
import { mapPublicPackage } from '../services/listing/mapPackage';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
import type { IMediaUploader } from '../services/media/MediaUploader';

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

const premium = mapPublicPackage({
  code: 'PREMIUM',
  displayName: 'Premium',
  description: 'Daha fazla görünürlük',
  badgeText: 'Önerilen',
  benefits: [
    'in|flash-outline|Acil ilan rozeti',
    'in|star-outline|Öne çıkan ilan · 7 gün',
  ],
  displayPrice: { amountMinor: 65000, currency: 'TRY' },
  defaultDurationDays: 45,
  allowsUrgent: true,
  showcaseEligible: false,
  featuredDays: 7,
  searchPriority: 50,
  sortOrder: 20,
});
assertEqual(premium.features[0]?.included, true, 'premium urgent included');
assertEqual(premium.features[1]?.included, true, 'premium featured included');

const card = mapPublishedCardToCatalog(
  {
    id: 'a1',
    title: 'Acil + öne çıkan',
    publishedAt: new Date().toISOString(),
    price: { amountMinor: 100, currency: 'TRY' },
    categoryId: 'c1',
    districtId: 'd1',
    provinceId: 'p1',
    cover: null,
    isFavorite: null,
    packageCode: 'PREMIUM',
    isUrgent: true,
    isFeatured: true,
    featuredUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
  'http://localhost:8080/api'
);
assert(card.isUrgent, 'maps isUrgent');
assert(card.isFeatured, 'maps isFeatured');
assert(Boolean(card.featuredUntil), 'maps featuredUntil');

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
    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'missing mock' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(hit.body), {
    status: hit.status,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

async function main(): Promise<void> {
  const sample = {
    id: 'adv-urgent',
    title: 'Acil ilan',
    publishedAt: new Date().toISOString(),
    price: { amountMinor: 100000, currency: 'TRY' },
    categoryId: 'c1',
    districtId: 'd1',
    provinceId: 'p1',
    cover: null,
    isFavorite: null,
    packageCode: 'PREMIUM',
    isUrgent: true,
    isFeatured: true,
    featuredUntil: new Date().toISOString(),
  };

  responses['GET /api/v1/homepage?limit=20'] = {
    status: 200,
    body: {
      newAdverts: { items: [], hasMore: false },
      urgent: { items: [sample], hasMore: false },
      featured: {
        items: [{ ...sample, id: 'adv-featured', isUrgent: false }],
        hasMore: false,
      },
      showcase: { seed: 's1', items: [] },
      banners: { items: [] },
      categories: { items: [] },
    },
  };

  const home = new HttpHomepageRepository('http://localhost:8080/api');
  const data = await home.getHomepage();
  assertEqual(data.urgentAdverts.length, 1, 'homepage urgent feed');
  assert(data.urgentAdverts[0]?.isUrgent, 'urgent feed item is urgent');
  assertEqual(data.trending.length, 1, 'homepage featured → trending');
  assert(data.trending[0]?.isFeatured, 'featured feed item is featured');
  assertEqual(data.specialOffers.length, 0, 'empty showcase does not use mock adverts');
  assertEqual(data.categories.length, 0, 'empty catalog is not replaced with mock categories');
  assertEqual(
    calls.filter((c) => c.url.includes('/v1/homepage')).length,
    1,
    'homepage uses single bootstrap request'
  );
  assert(
    !calls.some((c) => c.url.includes('/v1/homepage/urgent')),
    'legacy homepage feed endpoints are not called'
  );
  assert(
    !calls.some((c) => c.url.includes('/districts')),
    'homepage does not preload districts'
  );

  const media: IMediaUploader = {
    upload: async () => ({ assetId: 'asset-1', publicUrl: 'file://x' }),
  };
  const listing = new HttpListingRepository('http://localhost:8080/api', media);
  const draft = createEmptyDraft();
  draft.type = {
    categoryId: 'cat-1',
    categorySlug: 'satilik-yaris-ati',
    categoryName: 'Satılık Yarış Atı',
    parentSlug: 'satilik-atlar',
  };
  draft.details.title = 'Paket özellikli ilan';
  draft.details.description = 'Açıklama metni yeterince uzun olmalı.';
  draft.details.priceTl = '250000';
  draft.details.districtId = 'dist-1';
  draft.packageCode = 'ULTIMATE';
  draft.media = [
    {
      localId: 'm1',
      uri: 'file://a.jpg',
      mimeType: 'image/jpeg',
      fileName: 'a.jpg',
      isCover: true,
      assetId: 'asset-1',
    },
  ];

  responses['POST /api/v1/me/adverts'] = {
    status: 201,
    body: {
      id: 2,
      status: 'DRAFT',
      version: 1,
      mediaVersion: 1,
      categoryId: draft.type.categoryId,
      districtId: draft.details.districtId,
      horseId: null,
      title: draft.details.title,
      description: draft.details.description,
      price: { amountMinor: 25000000, currency: 'TRY' },
      properties: {},
      media: [],
    },
  };
  responses['POST /api/v1/me/adverts/2/media'] = {
    status: 200,
    body: { advertId: 2, mediaVersion: 2 },
  };
  responses['PUT /api/v1/me/adverts/2/media/cover'] = {
    status: 200,
    body: { advertId: 2, mediaVersion: 3 },
  };
  responses['PUT /api/v1/me/adverts/2/package'] = {
    status: 200,
    body: {
      id: 'asg-1',
      advertId: 2,
      packageCode: 'ULTIMATE',
      status: 'ACTIVE',
      startsAt: new Date().toISOString(),
      assignedByUserId: 'u1',
      assignedAt: new Date().toISOString(),
      source: 'SYSTEM',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  responses['POST /api/v1/me/adverts/2/submit'] = {
    status: 200,
    body: {
      id: 2,
      status: 'PENDING_REVIEW',
      version: 1,
      mediaVersion: 3,
      categoryId: draft.type.categoryId,
      districtId: draft.details.districtId,
      horseId: null,
      title: draft.details.title,
      description: draft.details.description,
      price: { amountMinor: 25000000, currency: 'TRY' },
      properties: {},
      media: [],
    },
  };

  calls.length = 0;
  const published = await listing.publish(draft, 'tok');
  assertEqual(published.advertId, 2, 'publish returns advert id');
  const pkg = calls.find((c) => c.url.includes('/package'));
  assertEqual(
    JSON.parse(String(pkg?.init.body)).packageCode,
    'ULTIMATE',
    'ULTIMATE package assigned'
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
