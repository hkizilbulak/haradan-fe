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

assert(!isPaytrCheckoutEnabled(), 'PayTR checkout is off');
assert(isListingPackageStepEnabled(), 'package step is enabled');
assert(DEFAULT_LISTING_PACKAGE_CODE === 'STANDARD', 'default package STANDARD');

console.log('selftest-paytr-flag: ok');
