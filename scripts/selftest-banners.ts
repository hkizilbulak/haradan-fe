/**
 * Banner servisi + HomepageAdBanner veri haritalama + Mock/HTTP DIP testi.
 * Çalıştır: npx tsx scripts/selftest-banners.ts
 */
import { MockBannerRepository } from '../services/banners/MockBannerRepository';
import { HttpBannerRepository } from '../services/banners/HttpBannerRepository';
import { resolvePublicMediaUrl } from '../services/media/publicUrl';
import { MOCK_BANNERS } from '../mocks/homepage';

let passed = 0;
let failed = 0;

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

async function runTests(): Promise<void> {
  const apiBase = 'http://localhost:8080/api';

  // 1. URL resolution tests for banners
  assertEqual(
    resolvePublicMediaUrl('/v1/media/asset-banner-1/BANNER', apiBase),
    'http://localhost:8080/api/v1/media/asset-banner-1/BANNER',
    'resolves relative banner media URL to absolute URL'
  );

  assertEqual(
    resolvePublicMediaUrl('https://images.unsplash.com/photo-test', apiBase),
    'https://images.unsplash.com/photo-test',
    'preserves external absolute banner URLs'
  );

  // 2. MockBannerRepository tests
  const mockRepo = new MockBannerRepository();
  const heroBanners = await mockRepo.getActiveBanners('HOMEPAGE_HERO');
  assert(heroBanners.length > 0, 'Mock repo returns HOMEPAGE_HERO banners');
  assertEqual(
    heroBanners[0].placement,
    'HOMEPAGE_HERO',
    'Hero banner is HOMEPAGE_HERO placement'
  );

  const promoBanners = await mockRepo.getActiveBanners('HOMEPAGE_PROMO');
  assert(promoBanners.length > 0, 'Mock repo returns HOMEPAGE_PROMO banners');
  assertEqual(
    promoBanners[0].placement,
    'HOMEPAGE_PROMO',
    'Promo banner is HOMEPAGE_PROMO placement'
  );

  const detailBanners = await mockRepo.getActiveBanners('LISTING_DETAIL');
  assert(detailBanners.length > 0, 'Mock repo returns LISTING_DETAIL banners');
  assertEqual(
    detailBanners[0].placement,
    'LISTING_DETAIL',
    'Detail banner is LISTING_DETAIL placement'
  );

  const searchBanners = await mockRepo.getActiveBanners('SEARCH');
  assert(searchBanners.length > 0, 'Mock repo returns SEARCH banners');
  assertEqual(
    searchBanners[0].placement,
    'SEARCH',
    'Search banner is SEARCH placement'
  );

  // 3. DIP Interface conformance
  const httpRepo = new HttpBannerRepository(apiBase);
  assert(
    typeof httpRepo.getActiveBanners === 'function',
    'HttpBannerRepository implements IBannerRepository'
  );
  assert(
    typeof mockRepo.getActiveBanners === 'function',
    'MockBannerRepository implements IBannerRepository'
  );

  // 4. Banner item data integrity
  const first = MOCK_BANNERS[0];
  assert(Boolean(first.id), 'Banner has ID');
  assert(Boolean(first.imageUrl), 'Banner has image URL');
  assert(typeof first.sortOrder === 'number', 'Banner has sortOrder');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void runTests();
