/**
 * İlan no (BIGINT) + onay modalı copy — prod self-test.
 * Çalıştır: npx tsx scripts/selftest-advert-id.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  advertKey,
  formatAdvertId,
  parseAdvertId,
  type AdvertId,
} from '../types/advertId';

const root = process.cwd();
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

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

console.log('── advert id helpers ──');
assert(formatAdvertId(42) === '42', 'format numeric id');
assert(parseAdvertId('128') === 128, 'parse route id');
assert(parseAdvertId('not-a-number') === null, 'reject invalid id');
assert(advertKey(99 as AdvertId) === '99', 'stable map key');

console.log('\n── post review modal ──');
const reviewSrc = read('components/post/PostReviewStep.tsx');
assert(reviewSrc.includes('formatAdvertId'), 'review uses formatAdvertId');
assert(reviewSrc.includes('copyToClipboard'), 'review copy helper');
assert(reviewSrc.includes('copy-outline'), 'review copy icon');
assert(reviewSrc.includes('İlan no'), 'review ilan no label');
assert(reviewSrc.includes('AdvertId'), 'review typed advert id');

console.log('\n── listing flow types ──');
assert(read('types/listing.ts').includes('id: AdvertId'), 'OwnerAdvertResponse numeric id');
assert(read('services/listing/listingDraftStore.ts').includes('submittedDraftId: AdvertId'), 'wizard stores numeric id');
assert(read('types/advert.ts').includes('id: AdvertId'), 'PublishedAdvertCard numeric id');

console.log('\n── mappers ──');
assert(read('services/adverts/mapPublishedCard.ts').includes('parseAdvertId'), 'card mapper normalizes id');
assert(read('services/advert/mapAdvertDetail.ts').includes('normalizeAdvertId'), 'detail mapper normalizes id');

console.log('\n── clipboard util ──');
assert(existsSync(join(root, 'utils/copyToClipboard.ts')), 'copy util exists');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
