/**
 * Rejected advert edit and resubmit flow self-test.
 * Run: npx tsx scripts/selftest-rejected-advert-edit-flow.ts
 */
import { HttpMyListingsRepository } from '../services/my-listings/HttpMyListingsRepository';
import { MockMyListingsRepository } from '../services/my-listings/MockMyListingsRepository';
import type { IMyListingsRepository } from '../services/my-listings/MyListingsRepository';
import { mapDraftToUpdate } from '../services/my-listings/mapDraftToUpdate';
import { isListingDraftDirty } from '../services/my-listings/isListingDraftDirty';
import type { ListingDraft } from '../types';

let passed = 0;
let failed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

type Call = { url: string; method: string; body?: string };
const httpCalls: Call[] = [];
const httpResponses: Record<string, { status: number; body: unknown }> = {};

function keyOf(method: string, url: string): string {
  return `${method.toUpperCase()} ${url.replace(/^https?:\/\/[^/]+/, '')}`;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = typeof init?.body === 'string' ? init.body : undefined;
  httpCalls.push({ url, method, body });
  const hit = httpResponses[keyOf(method, url)];
  if (!hit) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
  }
  return new Response(JSON.stringify(hit.body), {
    status: hit.status,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

async function testHttpFlow(): Promise<void> {
  const repo = new HttpMyListingsRepository('http://localhost:8080/api');

  const advertId = 2001;

  // 1. Mock GET /v1/me/adverts/2001 (rejected advert)
  httpResponses['GET /api/v1/me/adverts/2001'] = {
    status: 200,
    body: {
      id: advertId,
      status: 'REJECTED',
      version: 5,
      mediaVersion: 1,
      categoryId: 'cat-horse',
      districtId: 'dist-1',
      provinceId: 'prov-1',
      title: 'Reddedilen İlan Başlığı',
      description: 'Eski açıklama',
      price: { amountMinor: 250000000, currency: 'TRY' },
      properties: {
        sellerPhone: '+90 532 111 22 33',
        rejectionReason: 'Eksik aşı bilgisi ve hatalı telefon',
      },
      media: [],
    },
  };

  // Mock catalog tree
  httpResponses['GET /api/v1/categories'] = {
    status: 200,
    body: [
      {
        id: 'cat-horse',
        slug: 'satilik-yaris-ati',
        name: 'Satılık Yarış Atı',
        parentId: null,
        children: [],
      },
    ],
  };

  const editPayload = await repo.getEditDraft(advertId, 'test-token');
  assertEqual(editPayload.backendStatus, 'REJECTED', 'getEditDraft captures REJECTED backendStatus');
  assertEqual(editPayload.rejectionReason, 'Eksik aşı bilgisi ve hatalı telefon', 'getEditDraft captures rejectionReason');
  assertEqual(editPayload.version, 5, 'getEditDraft version is 5');

  // Verify resubmittable check logic
  const isResubmittable =
    editPayload.backendStatus === 'REJECTED' ||
    editPayload.backendStatus === 'CHANGES_REQUESTED';
  assert(isResubmittable, 'REJECTED advert is identified as resubmittable');

  // 2. Modify draft details and perform save + resubmit
  const modifiedDraft: ListingDraft = {
    ...editPayload.draft,
    details: {
      ...editPayload.draft.details,
      description: 'Düzeltilmiş ve güncellenmiş yeni açıklama.',
    },
  };

  assert(isListingDraftDirty(modifiedDraft, editPayload.draft), 'modified draft is dirty');

  // Mock PATCH /v1/me/adverts/2001
  httpResponses['PATCH /api/v1/me/adverts/2001'] = {
    status: 200,
    body: {
      id: advertId,
      status: 'REJECTED',
      version: 6,
      mediaVersion: 1,
      categoryId: 'cat-horse',
      districtId: 'dist-1',
      provinceId: 'prov-1',
      title: 'Reddedilen İlan Başlığı',
      description: 'Düzeltilmiş ve güncellenmiş yeni açıklama.',
      price: { amountMinor: 250000000, currency: 'TRY' },
      properties: {
        sellerPhone: '+90 532 111 22 33',
        rejectionReason: 'Eksik aşı bilgisi ve hatalı telefon',
      },
      media: [],
    },
  };

  // Mock PUT /v1/me/adverts/2001/properties
  httpResponses['PUT /api/v1/me/adverts/2001/properties'] = {
    status: 200,
    body: {
      id: advertId,
      status: 'REJECTED',
      version: 7,
      mediaVersion: 1,
      categoryId: 'cat-horse',
      districtId: 'dist-1',
      provinceId: 'prov-1',
      title: 'Reddedilen İlan Başlığı',
      description: 'Düzeltilmiş ve güncellenmiş yeni açıklama.',
      price: { amountMinor: 250000000, currency: 'TRY' },
      properties: {
        sellerPhone: '+90 532 111 22 33',
        rejectionReason: 'Eksik aşı bilgisi ve hatalı telefon',
      },
      media: [],
    },
  };

  // Mock POST /v1/me/adverts/2001/resubmit
  httpResponses['POST /api/v1/me/adverts/2001/resubmit'] = {
    status: 200,
    body: {
      id: advertId,
      status: 'PENDING_REVIEW',
      version: 8,
      mediaVersion: 1,
      categoryId: 'cat-horse',
      districtId: 'dist-1',
      provinceId: 'prov-1',
      title: 'Reddedilen İlan Başlığı',
      description: 'Düzeltilmiş ve güncellenmiş yeni açıklama.',
      price: { amountMinor: 250000000, currency: 'TRY' },
      properties: {
        sellerPhone: '+90 532 111 22 33',
      },
      media: [],
    },
  };

  // Simulate useMyListingEdit save({ andSubmit: true }) flow:
  // Step A: Update advert details
  const updateResult = await repo.update(
    advertId,
    mapDraftToUpdate(modifiedDraft, editPayload.version),
    'test-token'
  );
  assertEqual(updateResult.version, 7, 'repo.update returns bumped version 7');

  // Step B: Resubmit to review with latest version
  const resubmitResult = await repo.resubmit(advertId, updateResult.version, 'test-token');
  assertEqual(resubmitResult.backendStatus, 'PENDING_REVIEW', 'repo.resubmit transitions advert to PENDING_REVIEW');
  assertEqual(resubmitResult.status, 'pending', 'card status mapped to pending tab');
  assertEqual(resubmitResult.version, 8, 'repo.resubmit returns version 8');

  // Verify call sequence
  const patchCall = httpCalls.find((c) => c.method === 'PATCH' && c.url.includes('/2001'));
  const resubmitCall = httpCalls.find((c) => c.method === 'POST' && c.url.includes('/2001/resubmit'));
  assert(patchCall != null, 'PATCH /v1/me/adverts/2001 was called');
  assert(resubmitCall != null, 'POST /v1/me/adverts/2001/resubmit was called');
  assertEqual(
    JSON.parse(resubmitCall?.body ?? '{}').expectedVersion,
    7,
    'resubmit was called with latest version 7 from update'
  );
}

async function testMockFlow(): Promise<void> {
  const repo = new MockMyListingsRepository();

  // Advert 1009 is a rejected mock listing
  const editPayload = await repo.getEditDraft(1009, 'mock-token');
  assertEqual(editPayload.backendStatus, 'REJECTED', 'mock advert 1009 has backendStatus REJECTED');

  const modified: ListingDraft = {
    ...editPayload.draft,
    details: {
      ...editPayload.draft.details,
      title: 'Mock Güncellenmiş Başlık',
    },
  };

  // Update
  const updated = await repo.update(
    1009,
    mapDraftToUpdate(modified, editPayload.version),
    'mock-token'
  );
  assertEqual(updated.title, 'Mock Güncellenmiş Başlık', 'mock updated title');

  // Resubmit
  const resubmitted = await repo.resubmit(1009, updated.version, 'mock-token');
  assertEqual(resubmitted.backendStatus, 'PENDING_REVIEW', 'mock resubmitted status is PENDING_REVIEW');
  assertEqual(resubmitted.status, 'pending', 'mock resubmitted card status is pending');
}

async function main(): Promise<void> {
  await testHttpFlow();
  await testMockFlow();

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
