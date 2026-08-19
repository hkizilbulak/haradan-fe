/**
 * Satıldı özelliği — servis katmanı birim testleri.
 * Çalıştır: npx --yes tsx scripts/selftest-sold.ts
 */
import { mapOwnerAdvertToCard } from '../services/my-listings/mapOwnerAdvert';
import { toMyListingTab, backendStatusesForTab } from '../services/my-listings/statusTabs';
import { MockMyListingsRepository } from '../services/my-listings/MockMyListingsRepository';

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

// ── mapOwnerAdvertToCard: soldAt fallback ──────────────────────────────────

const baseDto = {
  id: 'abc',
  status: 'PUBLISHED',
  version: 1,
  mediaVersion: 1,
  categoryId: null,
  districtId: null,
  horseId: null,
  title: 'Test',
  description: null,
  price: null,
  properties: {},
  publishedAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

const publishedCard = mapOwnerAdvertToCard(baseDto, { apiBase: 'http://localhost', sellerId: 'u1' });
assert(publishedCard.soldAt === null, 'PUBLISHED card has null soldAt');
assert(publishedCard.status === 'published', 'PUBLISHED → published tab');

const soldDtoWithSoldAt = { ...baseDto, status: 'SOLD', soldAt: '2026-01-05T12:00:00Z' };
const soldCardExplicit = mapOwnerAdvertToCard(soldDtoWithSoldAt, { apiBase: 'http://localhost', sellerId: 'u1' });
assert(soldCardExplicit.soldAt === '2026-01-05T12:00:00Z', 'soldAt from explicit DTO field');
assert(soldCardExplicit.status === 'sold', 'SOLD → sold tab');
assert(soldCardExplicit.backendStatus === 'SOLD', 'backendStatus is SOLD');

const soldDtoNoSoldAt = { ...baseDto, status: 'SOLD' };
const soldCardFallback = mapOwnerAdvertToCard(soldDtoNoSoldAt, { apiBase: 'http://localhost', sellerId: 'u1' });
assert(soldCardFallback.soldAt !== null, 'soldAt fallback to updatedAt when DTO field absent');

// ── toMyListingTab ─────────────────────────────────────────────────────────

assert(toMyListingTab('SOLD') === 'sold', 'SOLD → sold tab');
assert(toMyListingTab('PUBLISHED') === 'published', 'PUBLISHED → published tab');
assert(toMyListingTab('ARCHIVED') === 'draft', 'ARCHIVED → draft tab');

// ── backendStatusesForTab ─────────────────────────────────────────────────

assert(backendStatusesForTab('sold').includes('SOLD'), 'sold tab fetches SOLD status');
assert(backendStatusesForTab('published').includes('PUBLISHED'), 'published tab fetches PUBLISHED');
assert(!backendStatusesForTab('published').includes('SOLD'), 'published tab does NOT fetch SOLD');

// ── MockMyListingsRepository.markSold ─────────────────────────────────────

const repo = new MockMyListingsRepository();

async function runAsyncTests() {
  // list seeded published items
  const before = await repo.list('published', 'token');
  const item = before.items[0];
  if (!item) {
    console.error('FAIL mock seeded at least one published item — no items found');
    failed++;
    return;
  }

  // markSold transitions status
  const updated = await repo.markSold(item.id, item.version, 'token');
  assert(updated.status === 'sold', 'markSold returns status=sold');
  assert(updated.backendStatus === 'SOLD', 'markSold returns backendStatus=SOLD');
  assert(typeof updated.soldAt === 'string' && updated.soldAt.length > 0, 'markSold returns non-null soldAt');
  assert(updated.version === item.version + 1, 'markSold bumps version');

  // stale version rejected
  try {
    await repo.markSold(item.id, item.version /* old version */, 'token');
    assert(false, 'markSold with stale version should throw');
  } catch {
    assert(true, 'markSold with stale version throws STALE_VERSION');
  }

  // not found
  try {
    await repo.markSold('nonexistent-id', 1, 'token');
    assert(false, 'markSold with unknown id should throw');
  } catch {
    assert(true, 'markSold with unknown id throws NOT_FOUND');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

void runAsyncTests();
