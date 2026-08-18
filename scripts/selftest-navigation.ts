/**
 * Listings/home navigation helpers.
 * Çalıştır: npx --yes tsx scripts/selftest-navigation.ts
 */
import {
  HEADER_FLEX_SLOT_POINTER_EVENTS,
  buildListingsHref,
  buildMyListingsHref,
  headerNavHref,
  headerNavKeyFromPath,
} from '../services/navigation';

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

assert(
  HEADER_FLEX_SLOT_POINTER_EVENTS === 'box-none',
  'header flex slots pass hits through empty area (İlanlarım overlay)'
);

assert(headerNavKeyFromPath('/') === 'home', 'home path');
assert(headerNavKeyFromPath('/index') === 'home', 'index path is home');
assert(headerNavKeyFromPath('/listings') === 'listings', 'listings path');
assert(
  headerNavKeyFromPath('/listings?q=arap') === 'listings',
  'listings path ignores query'
);
assert(
  headerNavKeyFromPath('/my-listings') === 'my-listings',
  'İlanlarım path'
);
assert(
  headerNavKeyFromPath('/my-listings/') === 'my-listings',
  'İlanlarım trailing slash'
);
assert(
  headerNavKeyFromPath('/my-listings/edit/abc') === 'my-listings',
  'İlanlarım edit nested path stays my-listings (not listings)'
);
assert(
  headerNavKeyFromPath('/auth/login') === '',
  'unrelated path has no header nav key'
);

assert(buildMyListingsHref(true) === '/my-listings', 'logged-in İlanlarım href');
assert(
  buildMyListingsHref(false) === '/auth/login?next=/my-listings',
  'guest İlanlarım href preserves next'
);
assert(headerNavHref('home', true) === '/', 'home href');
assert(headerNavHref('listings', true) === '/listings', 'listings href');
assert(
  headerNavHref('my-listings', true) === '/my-listings',
  'İlanlarım href when logged in'
);
assert(
  headerNavHref('my-listings', false) === '/auth/login?next=/my-listings',
  'İlanlarım href when logged out'
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
