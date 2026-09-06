/**
 * Post wizard request budget + what each endpoint does.
 * Çalıştır: npm run selftest:post-wizard-requests
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCachedCatalogRepository } from '../services/catalog/CachedCatalogRepository';
import { HttpCatalogRepository } from '../services/catalog/HttpCatalogRepository';
import { HttpListingRepository } from '../services/listing/HttpListingRepository';
import { HttpLocationLookup } from '../services/location/HttpLocationLookup';

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

const calls: string[] = [];
const responses: Record<string, { status: number; body: unknown }> = {};

function pathOnly(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, '').split('?')[0] ?? url;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  const path = pathOnly(url);
  calls.push(`${method} ${path}`);

  const hit = responses[`${method} ${path}`] ?? responses[path];
  if (!hit) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: path }), {
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
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

  console.log(`
--- What each request does ---
GET  /v1/categories              → listing type tree (wizard type step)
GET  /v1/provinces               → province picker (details)
GET  /v1/provinces/{id}/districts→ district picker after province
GET  /v1/packages                → package cards (lazy: package step only)
GET  /v1/me/favorites            → header hearts (skipped on /post)
GET  /v1/categories/{id}/form    → leaf category dynamic fields (1× live UUID)
POST /v1/me/adverts              → create DRAFT shell (details→package)
PUT  /v1/me/adverts/{id}/properties → dynamic props + phone
POST /v1/media/uploads ×N        → initiate each image upload
PUT  /v1/media/assets/{id}/content ×N → upload bytes
POST /v1/media/assets/{id}/confirm ×N → finalize asset
POST /v1/me/adverts/{id}/media ×N → attach assets (cover-first ⇒ no cover PUT)
PUT  /v1/me/adverts/{id}/package → assign package
POST /v1/me/adverts/{id}/submit  → send to review
`);

  // Wiring: no ortak-alanlar network form; packages lazy; favorites skip /post
  const wizardSrc = read('components/post/PostWizardView.tsx');
  assert(wizardSrc.includes('localOnly: true'), 'ortak-alanlar form is localOnly');
  assert(
    wizardSrc.includes("wizard.step === 'package'"),
    'packages fetch gated to package step'
  );
  const favSrc = read('hooks/useFavorites.ts');
  assert(favSrc.includes("/post"), 'favorites hydrate skips /post');
  const pkgsSrc = read('services/listing/HttpListingRepository.ts');
  assert(pkgsSrc.includes('packagesInflight'), 'packages have inflight dedupe');
  assert(pkgsSrc.includes('coverIsFirst'), 'cover PUT skipped when cover-first');
  const geoSrc = read('services/location/HttpLocationLookup.ts');
  assert(geoSrc.includes('provincesInflight'), 'provinces have inflight');
  assert(geoSrc.includes('districtsInflight'), 'districts have inflight');

  // Catalog: seed UUID + slug → one live form GET
  const liveLeaf = '3c40f0e6-c570-46f1-9e7c-b3a5a29b82c8';
  const seedLeaf = 'c1000000-0000-4000-8000-000000000011';
  responses['GET /api/v1/categories'] = {
    status: 200,
    body: {
      items: [
        {
          id: 'root-1',
          slug: 'satilik-atlar',
          name: 'Satılık Atlar',
          children: [
            {
              id: liveLeaf,
              slug: 'satilik-yaris-ati',
              name: 'Satılık Yarış Atı',
              children: [],
            },
          ],
        },
      ],
    },
  };
  responses[`GET /api/v1/categories/${liveLeaf}/form`] = {
    status: 200,
    body: {
      categoryId: liveLeaf,
      slug: 'satilik-yaris-ati',
      name: 'Satılık Yarış Atı',
      allowTjk: true,
      properties: [{ code: 'HORSE_AGE', title: 'Yaş', sortOrder: 1 }],
    },
  };

  calls.length = 0;
  const catalog = createCachedCatalogRepository(
    new HttpCatalogRepository('http://localhost:8080/api')
  );
  await catalog.getCategoryTree();
  const formCallsBefore = calls.filter((c) => c.includes('/form')).length;

  // Parallel: stale seed UUID + live slug must share one form GET
  await Promise.all([
    catalog.getCategoryFormDefinition(seedLeaf, {
      categorySlug: 'satilik-yaris-ati',
    }),
    catalog.getCategoryFormDefinition(liveLeaf, {
      categorySlug: 'satilik-yaris-ati',
    }),
  ]);
  const formCalls = calls.filter((c) => c.includes('/form'));
  assertEqualish(formCalls.length - formCallsBefore, 1, 'one leaf form GET for seed+live');
  assert(
    !calls.some((c) => c.includes(seedLeaf) && c.includes('/form')),
    'stale seed UUID is not used in /form path'
  );
  assert(
    formCalls.some((c) => c.includes(liveLeaf)),
    'form uses live tree UUID'
  );

  // Global form: zero network
  const beforeGlobal = calls.length;
  await catalog.getCategoryFormDefinition('ortak-alanlar', {
    categorySlug: 'ortak-alanlar',
    localOnly: true,
  });
  assertEqualish(
    calls.length - beforeGlobal,
    0,
    'ortak-alanlar localOnly makes no HTTP'
  );

  // Packages: second getPackages within TTL → no second GET
  responses['GET /api/v1/packages'] = {
    status: 200,
    body: {
      items: [
        {
          code: 'STANDARD',
          displayName: 'Standart',
          description: '',
          benefits: [],
          displayPrice: { amountMinor: 0, currency: 'TRY' },
          defaultDurationDays: 30,
          allowsUrgent: false,
          showcaseEligible: false,
          searchPriority: 1,
          sortOrder: 1,
        },
      ],
    },
  };
  const listing = new HttpListingRepository('http://localhost:8080/api');
  calls.length = 0;
  await Promise.all([listing.getPackages(), listing.getPackages()]);
  assertEqualish(
    calls.filter((c) => c.includes('/packages')).length,
    1,
    'parallel getPackages → one HTTP'
  );
  await listing.getPackages();
  assertEqualish(
    calls.filter((c) => c.includes('/packages')).length,
    1,
    'cached getPackages → no refetch'
  );

  // Provinces inflight
  responses['GET /api/v1/provinces'] = {
    status: 200,
    body: { items: [{ id: 'p1', name: 'Ankara' }] },
  };
  const geo = new HttpLocationLookup('http://localhost:8080/api');
  calls.length = 0;
  await Promise.all([geo.listProvinces(), geo.listProvinces()]);
  assertEqualish(
    calls.filter((c) => c.endsWith('/provinces')).length,
    1,
    'parallel listProvinces → one HTTP'
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

function assertEqualish(actual: number, expected: number, name: string): void {
  assert(actual === expected, `${name} (got ${actual})`);
}

void main();
