/**
 * İlan verme istek bütçesi: eski waterfall vs fazlı (details→shell, package→media, CTA→finalize).
 * Çalıştır: npm run selftest:listing-publish-flow
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpListingRepository } from '../services/listing/HttpListingRepository';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
import { HttpMediaUploader } from '../services/media/HttpMediaUploader';
import type { ListingDraft, ListingMediaSlot } from '../types/listing';

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

type Call = { method: string; path: string };

function summarize(calls: Call[]): string[] {
  return calls.map((c) => `${c.method} ${c.path}`);
}

/** Legacy waterfall (prod curl): N images all on package CTA. */
function legacyRequestCount(imageCount: number): number {
  const mediaUpload = imageCount * 3; // initiate + content + confirm
  const draftsLookup = 1; // GET ?status=DRAFT
  const create = 1;
  const attach = imageCount;
  const cover = 1;
  const addressPatch = 1;
  const properties = 1;
  const packageAssign = 1;
  const submit = 1;
  return (
    mediaUpload +
    draftsLookup +
    create +
    attach +
    cover +
    addressPatch +
    properties +
    packageAssign +
    submit
  );
}

/** New phased totals for N images. */
function phasedTotals(imageCount: number): {
  detailsToPackage: number;
  backgroundMedia: number;
  packageCta: number;
  total: number;
  ctaCriticalPath: number;
} {
  const detailsToPackage = 2; // POST create + PUT properties (address in create)
  const backgroundMedia = imageCount * 3 + imageCount + 1; // upload*3 + attach + cover
  const packageCta = 2; // PUT package + POST submit
  return {
    detailsToPackage,
    backgroundMedia,
    packageCta,
    total: detailsToPackage + backgroundMedia + packageCta,
    ctaCriticalPath: packageCta,
  };
}

type MockHit = { status: number; body: unknown };
const responses: Record<string, MockHit> = {};
const calls: Call[] = [];

function routeKey(method: string, url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0] ?? '';
  return `${method.toUpperCase()} ${path}`;
}

function json(status: number, body: unknown): Response {
  if (status === 204) return new Response(null, { status: 204 });
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.startsWith('blob:')) {
    return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }

  const method = (init?.method ?? 'GET').toUpperCase();
  const pathOnly =
    url.replace(/^https?:\/\/[^/]+/, '').split('?')[0] ?? url;
  calls.push({ method, path: pathOnly });

  if (method === 'POST' && /\/v1\/media\/uploads$/.test(pathOnly)) {
    const assetId = `aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee${String(
      calls.filter((c) => c.path.endsWith('/media/uploads')).length
    ).padStart(2, '0')}`;
    return json(201, {
      assetId,
      upload: {
        method: 'PUT',
        url: `http://localhost:8080/api/v1/media/assets/${assetId}/content`,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
      constraints: {
        allowedContentTypes: ['image/jpeg'],
        maxByteSize: 10_000_000,
        requiredHeaders: ['Content-Type'],
      },
    });
  }
  if (method === 'PUT' && /\/v1\/media\/assets\/[^/]+\/content$/.test(pathOnly)) {
    return json(204, undefined);
  }
  if (method === 'POST' && /\/v1\/media\/assets\/[^/]+\/confirm$/.test(pathOnly)) {
    return json(200, { assetId: 'x', lifecycleStatus: 'READY' });
  }
  if (method === 'POST' && /\/v1\/me\/adverts\/\d+\/media$/.test(pathOnly)) {
    const nAttach = calls.filter(
      (c) => c.method === 'POST' && /\/media$/.test(c.path)
    ).length;
    return json(200, { advertId: 81, mediaVersion: nAttach + 1 });
  }
  if (method === 'PUT' && /\/v1\/me\/adverts\/\d+\/media\/cover$/.test(pathOnly)) {
    return json(200, { advertId: 81, mediaVersion: 99 });
  }

  const hit = responses[routeKey(method, url)];
  if (!hit) {
    return json(404, {
      code: 'NOT_FOUND',
      message: `missing mock ${routeKey(method, url)}`,
    });
  }
  return json(hit.status, hit.body);
}) as typeof fetch;

function makeDraft(imageCount: number): ListingDraft {
  const draft = createEmptyDraft();
  draft.type = {
    categoryId: 'c1000000-0000-4000-8000-000000000021',
    categorySlug: 'pansiyon-haralar',
    categoryName: 'Pansiyon Haralar',
    parentSlug: 'at-hizmetleri',
  };
  draft.details.title = 'test ilan';
  draft.details.description = 'test ilan';
  draft.details.priceTl = '1000';
  draft.details.districtId = '0540871b-3b50-5994-8265-d658e0053cab';
  draft.details.address = 'Merkez';
  draft.details.sellerPhone = '5321570811';
  draft.details.phoneCountryIso = 'TR';
  draft.details.properties = {
    grassPaddock: true,
    sandPaddock: true,
  };
  draft.packageCode = 'PREMIUM';
  draft.media = Array.from({ length: imageCount }, (_, i) => {
    const slot: ListingMediaSlot = {
      localId: `m${i}`,
      uri: `blob:mock-${i}`,
      mimeType: 'image/jpeg',
      fileName: `img-${i}.jpg`,
      isCover: i === 0,
      assetId: null,
    };
    return slot;
  });
  return draft;
}

async function main(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const readSrc = (rel: string) => readFileSync(join(root, rel), 'utf8');

  const n = 3;
  const oldTotal = legacyRequestCount(n);
  const neu = phasedTotals(n);
  assertEqual(oldTotal, 19, 'legacy 3-image waterfall = 19 requests');
  assertEqual(neu.detailsToPackage, 2, 'details→package = create + properties');
  assertEqual(neu.backgroundMedia, 13, 'background media = 9 upload + 3 attach + cover');
  assertEqual(neu.packageCta, 2, 'package CTA = package + submit');
  assertEqual(neu.total, 17, 'phased total = 17 (drops draft lookup + address PATCH)');
  assertEqual(neu.ctaCriticalPath, 2, 'CTA critical path = 2 when media already ready');
  assert(neu.total < oldTotal, 'phased total below legacy');
  assert(neu.ctaCriticalPath < oldTotal, 'CTA no longer carries full waterfall');

  console.log('\n--- Request budget (3 images) ---');
  console.log(`OLD (all on CTA):     ${oldTotal}`);
  console.log(`NEW details→package:  ${neu.detailsToPackage}`);
  console.log(`NEW background media: ${neu.backgroundMedia}`);
  console.log(`NEW package CTA:      ${neu.packageCta}`);
  console.log(`NEW total:            ${neu.total}`);
  console.log(`NEW CTA critical:     ${neu.ctaCriticalPath} (media already done)`);

  const repoSrc = readSrc('services/listing/HttpListingRepository.ts');
  assert(repoSrc.includes('persistDraftShell'), 'repo exposes persistDraftShell');
  assert(repoSrc.includes('startMediaPipeline'), 'repo starts background media');
  assert(!repoSrc.includes('status=DRAFT'), 'repo does not list drafts to find id');
  assert(repoSrc.includes('awaitMediaPipeline'), 'repo awaits media before finalize');

  const wizardSrc = readSrc('hooks/useListingWizard.ts');
  assert(
    wizardSrc.includes('persistDraftAndStartMedia'),
    'wizard exposes persistDraftAndStartMedia'
  );
  assert(
    !/const persist\s*=\s*\n?\s*listingRepo\.persistDraftShell/.test(wizardSrc) &&
      !wizardSrc.includes('listingRepo.persistDraftShell ?? listingRepo.createDraft'),
    'wizard does not extract persistDraftShell (keeps this)'
  );
  assert(
    wizardSrc.includes('await listingRepo.persistDraftShell(') ||
      wizardSrc.includes('listingRepo.persistDraftShell\n') ||
      /listingRepo\.persistDraftShell\s*\?/.test(wizardSrc),
    'wizard calls persistDraftShell on listingRepo'
  );

  // Reproduce prod bug: extracted class method loses `this`.
  const listingForBind = new HttpListingRepository(
    'http://localhost:8080/api',
    new HttpMediaUploader('http://localhost:8080/api')
  );
  const extracted = listingForBind.persistDraftShell;
  let unboundFailed = false;
  try {
    await extracted.call(undefined as never, makeDraft(0), 'token');
  } catch (err) {
    unboundFailed =
      err instanceof TypeError &&
      String(err.message).includes('upsertDraftShell');
  }
  assert(unboundFailed, 'extracted persistDraftShell loses this (TypeError)');

  // Bound / method-call form must succeed (empty media → create + no props if none).
  responses['POST /api/v1/me/adverts'] = {
    status: 201,
    body: {
      id: 70,
      status: 'DRAFT',
      version: 1,
      mediaVersion: 1,
      categoryId: 'c1000000-0000-4000-8000-000000000021',
      title: 'bind-test',
      properties: {},
      media: [],
      publishedAt: null,
      deletedAt: null,
    },
  };
  const boundDraft = makeDraft(0);
  boundDraft.details.title = 'bind-test';
  boundDraft.details.sellerPhone = '';
  boundDraft.details.properties = {};
  calls.length = 0;
  const boundShell = await listingForBind.persistDraftShell(boundDraft, 'token');
  assertEqual(boundShell.advertId, 70, 'method call keeps this and creates draft');

  const viewSrc = readSrc('components/post/PostWizardView.tsx');
  assert(
    viewSrc.includes('persistDraftAndStartMedia'),
    'details next persists before package step'
  );
  assert(
    viewSrc.includes('mediaSyncStatus'),
    'package step surfaces media sync status'
  );

  const draft = makeDraft(3);
  const listing = new HttpListingRepository(
    'http://localhost:8080/api',
    new HttpMediaUploader('http://localhost:8080/api')
  );

  responses['POST /api/v1/me/adverts'] = {
    status: 201,
    body: {
      id: 81,
      status: 'DRAFT',
      version: 1,
      mediaVersion: 1,
      categoryId: draft.type?.categoryId,
      title: draft.details.title,
      description: draft.details.description,
      address: draft.details.address,
      districtId: draft.details.districtId,
      price: { amountMinor: 100000, currency: 'TRY' },
      properties: {},
      media: [],
      publishedAt: null,
      deletedAt: null,
    },
  };
  responses['PUT /api/v1/me/adverts/81/properties'] = {
    status: 200,
    body: {
      id: 81,
      status: 'DRAFT',
      version: 2,
      mediaVersion: 1,
      categoryId: draft.type?.categoryId,
      properties: draft.details.properties,
      media: [],
      publishedAt: null,
      deletedAt: null,
    },
  };
  responses['PUT /api/v1/me/adverts/81/package'] = {
    status: 200,
    body: { id: 'a1', advertId: 81, packageCode: 'PREMIUM', status: 'ACTIVE' },
  };
  responses['POST /api/v1/me/adverts/81/submit'] = {
    status: 200,
    body: {
      id: 81,
      status: 'PENDING_REVIEW',
      version: 2,
      mediaVersion: 5,
      categoryId: draft.type?.categoryId,
      title: draft.details.title,
      properties: {},
      media: [],
      publishedAt: null,
      deletedAt: null,
    },
  };

  calls.length = 0;
  const shell = await listing.persistDraftShell(draft, 'token');
  assertEqual(shell.advertId, 81, 'shell creates advert 81');
  const afterShell = summarize(calls);
  assertEqual(
    afterShell.filter((c) => c === 'POST /api/v1/me/adverts').length,
    1,
    'phase1: one create'
  );
  assertEqual(
    afterShell.filter((c) => c === 'PUT /api/v1/me/adverts/81/properties')
      .length,
    1,
    'phase1: one properties'
  );
  assert(
    !afterShell.some((c) => c.includes('/submit') || c.includes('/package')),
    'phase1: no package/submit yet'
  );

  await listing.awaitMediaPipeline(81);
  const afterMedia = summarize(calls);
  const uploadInits = afterMedia.filter((c) =>
    c.endsWith('/media/uploads')
  ).length;
  const confirms = afterMedia.filter((c) => c.includes('/confirm')).length;
  const attaches = afterMedia.filter(
    (c) => c === 'POST /api/v1/me/adverts/81/media'
  ).length;
  const covers = afterMedia.filter((c) => c.includes('/media/cover')).length;
  assertEqual(uploadInits, 3, 'background: 3 upload initiates');
  assertEqual(confirms, 3, 'background: 3 confirms');
  assertEqual(attaches, 3, 'background: 3 attaches');
  assertEqual(covers, 1, 'background: 1 cover');
  assert(
    !afterMedia.some((c) => c.includes('status=DRAFT')),
    'no GET drafts lookup'
  );
  assert(
    !afterMedia.some((c) => c === 'PATCH /api/v1/me/adverts/81'),
    'no separate address PATCH (address on create)'
  );

  const beforePublish = calls.length;
  draft.advertId = 81;
  draft.serverVersion = 2;
  draft.mediaVersion = 99;
  const published = await listing.publish(draft, 'token');
  assertEqual(published.status, 'PENDING_REVIEW', 'publish submits for review');
  const ctaCalls = summarize(calls.slice(beforePublish));
  assertEqual(ctaCalls.length, 2, 'CTA only package + submit');
  assertEqual(ctaCalls[0], 'PUT /api/v1/me/adverts/81/package', 'CTA package first');
  assertEqual(ctaCalls[1], 'POST /api/v1/me/adverts/81/submit', 'CTA submit second');

  const totalSim = calls.length;
  console.log('\n--- Simulated call log ---');
  console.log(
    summarize(calls)
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n')
  );
  console.log(`simulated total: ${totalSim} (expected ~${neu.total})`);
  assertEqual(totalSim, neu.total, 'simulated total matches phased budget');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
