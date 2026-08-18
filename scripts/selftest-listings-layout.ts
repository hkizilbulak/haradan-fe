/**
 * Listings layout & empty-state self-test.
 * Çalıştır: ./node_modules/.bin/sucrase-node scripts/selftest-listings-layout.ts
 */
import {
  formatTlInput,
  matchesPrice,
  parseProvinceParam,
  parseTlInput,
  parseTlParam,
  priceHint,
  serializeProvinceParam,
  tlToMinor,
} from '../components/listings/filterConfig';
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

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

// 1. Province param parsing & serialization
assertEqual(parseProvinceParam(undefined).length, 0, 'undefined province param yields empty list');
assertEqual(parseProvinceParam(null).length, 0, 'null province param yields empty list');
assertEqual(parseProvinceParam('').length, 0, 'empty string province param yields empty list');
assertEqual(parseProvinceParam('34,06').length, 2, 'comma separated province param parsed');
assertEqual(serializeProvinceParam([]), null, 'empty province list serializes to null');
assertEqual(serializeProvinceParam(['34']), '34', 'single province list serializes to string');
assertEqual(serializeProvinceParam(['34', '06']), '34,06', 'multiple province list serializes with comma');

// 2. Price TL parsing, conversion, matching & hint
assertEqual(parseTlParam(undefined), null, 'undefined price param yields null');
assertEqual(parseTlParam('0'), 0, '0 price param parsed to 0');
assertEqual(parseTlParam('150000'), 150000, 'valid number price param parsed');
assertEqual(parseTlParam('invalid'), null, 'invalid price param yields null');
assertEqual(parseTlInput('150.000 TL'), 150000, 'parseTlInput strips non-digits');
assertEqual(parseTlInput(''), null, 'parseTlInput empty returns null');

assertEqual(tlToMinor(100), 10000, '100 TL is 10000 kurus');
assert(matchesPrice(5000000, 10000, 100000), '50,000 TL matches range 10,000 - 100,000');
assert(!matchesPrice(500000, 10000, 100000), '5,000 TL fails min 10,000');
assert(!matchesPrice(50000000, 10000, 100000), '500,000 TL fails max 100,000');

assertEqual(priceHint(null, null), null, 'null min and max yields null hint');
assert(priceHint(1000, null)?.includes('1.000'), 'min only hint formatted');
assert(priceHint(null, 5000)?.includes('5.000'), 'max only hint formatted');
assert(priceHint(1000, 5000)?.includes('1.000') && priceHint(1000, 5000)?.includes('5.000'), 'range hint formatted');

// 3. Navigation href building for listings
assertEqual(buildListingsHref({}), '/listings', 'empty query produces bare /listings');
assertEqual(
  buildListingsHref({ category: 'satilik-atlar' }),
  '/listings?category=satilik-atlar',
  'category query produces /listings?category=...'
);
assertEqual(
  buildListingsHref({ q: 'safkan' }),
  '/listings?q=safkan',
  'search query produces /listings?q=safkan'
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
