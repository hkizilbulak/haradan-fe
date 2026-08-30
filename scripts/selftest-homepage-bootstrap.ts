/**
 * Anasayfa bootstrap — tek istek + il/ilçe isimleri kartta.
 * Çalıştır: npx tsx scripts/selftest-homepage-bootstrap.ts
 */
import { HttpHomepageRepository } from '../services/homepage/HttpHomepageRepository';
import { mapPublishedCardToCatalog } from '../services/adverts/mapPublishedCard';
import { formatAdvertLocation } from '../services/location';

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

type Call = { url: string; method: string };
const calls: Call[] = [];

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  calls.push({ url, method });
  if (url.includes('/v1/homepage')) {
    return new Response(
      JSON.stringify({
        newAdverts: {
          items: [
            {
              id: 'a1',
              title: 'Yeni',
              publishedAt: new Date().toISOString(),
              price: { amountMinor: 100, currency: 'TRY' },
              categoryId: 'c1',
              districtId: 'd1',
              provinceId: 'p1',
              districtName: 'Silivri',
              provinceName: 'İstanbul',
              cover: null,
              isFavorite: null,
              isUrgent: false,
              isFeatured: false,
            },
          ],
          hasMore: false,
        },
        urgent: { items: [], hasMore: false },
        featured: { items: [], hasMore: false },
        showcase: { seed: 's', items: [] },
        banners: {
          items: [
            {
              id: 'b1',
              placement: 'HOMEPAGE_HERO',
              sortOrder: 1,
              imageUrl: '/v1/media/x/BANNER',
              title: null,
              altText: null,
              targetUrl: null,
            },
          ],
        },
        categories: {
          items: [{ id: 'c1', slug: 'atlar', name: 'Atlar', allowTjk: false, children: [] }],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
}) as typeof fetch;

async function main(): Promise<void> {
  const card = mapPublishedCardToCatalog(
    {
      id: 'a1',
      title: 'Kart',
      publishedAt: new Date().toISOString(),
      price: { amountMinor: 1, currency: 'TRY' },
      categoryId: 'c1',
      districtId: 'd1',
      provinceId: 'p1',
      districtName: 'Çankaya',
      provinceName: 'Ankara',
      cover: null,
      isFavorite: null,
      isUrgent: false,
      isFeatured: false,
    },
    'http://localhost:8080/api'
  );
  assertEqual(card.provinceName, 'Ankara', 'card keeps provinceName');
  assertEqual(card.districtName, 'Çankaya', 'card keeps districtName');
  assertEqual(
    formatAdvertLocation(card),
    'Çankaya, Ankara',
    'location formats from card names without geo fetch'
  );

  calls.length = 0;
  const home = new HttpHomepageRepository('http://localhost:8080/api');
  const data = await home.getHomepage();

  assertEqual(calls.length, 1, 'exactly one network call for homepage');
  assert(calls[0]?.url.includes('/v1/homepage?limit=20'), 'calls bootstrap path');
  assertEqual(data.newAdverts.length, 1, 'maps new adverts');
  assertEqual(data.newAdverts[0]?.locationName, 'Silivri, İstanbul', 'bootstrap card location');
  assertEqual(data.categories.length, 1, 'maps categories');
  assertEqual(data.banners.length, 1, 'maps banners');
  assert(
    !calls.some((c) => c.url.includes('/provinces') || c.url.includes('/districts')),
    'no geo fan-out on homepage'
  );
  assert(
    !calls.some((c) => c.url.includes('/v1/adverts')),
    'no live-search preload on homepage load'
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
