/**
 * Self-test: PayTR + package steps are temporarily forced OFF.
 * Run: npx tsx scripts/selftest-paytr-flag.ts
 */
import {
  DEFAULT_LISTING_PACKAGE_CODE,
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '../constants/Paytr';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(!isPaytrCheckoutEnabled(), 'PayTR forced off');
assert(!isListingPackageStepEnabled(), 'package step forced off');
assert(DEFAULT_LISTING_PACKAGE_CODE === 'STANDARD', 'default package STANDARD');

console.log('selftest-paytr-flag: ok');
