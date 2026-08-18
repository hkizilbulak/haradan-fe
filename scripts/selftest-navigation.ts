/**
 * Listings/home navigation helpers.
 * Çalıştır: npx --yes tsx scripts/selftest-navigation.ts
 */
import { buildListingsHref } from '../services/navigation';

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

assert(
  buildListingsHref({ category: 'satilik-atlar' }) ===
    '/listings?category=satilik-atlar',
  'canonical category href'
);

assert(
  buildListingsHref({ category: 'at-hizmetleri', q: 'nakliye' }) ===
    '/listings?q=nakliye&category=at-hizmetleri',
  'q + category order'
);

assert(
  !buildListingsHref({ category: 'satilik-atlar' }).includes('_nav'),
  'href has no ephemeral nav token (hydration-safe)'
);

assert(buildListingsHref({}) === '/listings', 'empty query is bare path');

const encoded = buildListingsHref({ q: 'a b' });
assert(encoded.includes('q=a+b') || encoded.includes('q=a%20b'), 'query encoded');

assert(
  buildListingsHref({ category: 'satilik-atlar' }) ===
    buildListingsHref({ category: 'satilik-atlar' }),
  'same category produces stable URL'
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
